import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    supabase,
    ClubMember,
    Post,
    Message,
    Mission,
    MissionProgress,
    getMembers,
    getPosts,
    getMessages,
    getMissions,
    getMissionProgress,
    verifyClubPin,
    createPost,
    sendMessage,
    completeMission,
    uploadMedia,
    addReaction,
    getReactionsForPost,
    subscribeToMessages,
    subscribeToPosts,
    updateMemberAvatar,
} from './supabase';

interface StoreState {
    // Auth
    isAuthenticated: boolean;
    currentUser: ClubMember | null;
    members: ClubMember[];

    // Data
    posts: Post[];
    messages: Message[];
    missions: Mission[];
    missionProgress: MissionProgress[];
    postReactions: Record<string, string[]>; // postId -> array of emojis

    // Loading states
    isLoading: boolean;

    // Actions
    login: (pin: string, memberId: string) => Promise<boolean>;
    logout: () => void;
    refreshData: () => Promise<void>;
    addNewPost: (type: 'image' | 'video', file: File, caption: string, stickers?: string[]) => Promise<boolean>;
    addNewPostFromUrl: (type: 'image' | 'video', url: string, caption: string, stickers?: string[]) => Promise<boolean>;
    sendNewMessage: (type: 'text' | 'image' | 'audio' | 'sticker', content?: string, file?: File) => Promise<boolean>;
    completeMissionAction: (missionId: string) => Promise<boolean>;
    toggleReaction: (postId: string, emoji: string) => Promise<void>;
    getMemberById: (id: string) => ClubMember | undefined;
    updateAvatar: (avatarUrl: string) => Promise<boolean>;
}

const StoreContext = createContext<StoreState | null>(null);

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
};

interface StoreProviderProps {
    children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<ClubMember | null>(null);
    const [members, setMembers] = useState<ClubMember[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [missionProgress, setMissionProgress] = useState<MissionProgress[]>([]);
    const [postReactions, setPostReactions] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Load all data
    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [membersData, postsData, messagesData, missionsData] = await Promise.all([
                getMembers(),
                getPosts(),
                getMessages(),
                getMissions(),
            ]);

            setMembers(membersData);
            setPosts(postsData);
            setMessages(messagesData);
            setMissions(missionsData);

            // Load reactions for all posts
            const reactionsMap: Record<string, string[]> = {};
            for (const post of postsData) {
                const reactions = await getReactionsForPost(post.id);
                reactionsMap[post.id] = reactions.map(r => r.emoji);
            }
            setPostReactions(reactionsMap);

            // Load mission progress for current user
            if (currentUser) {
                const progress = await getMissionProgress(currentUser.id);
                setMissionProgress(progress);
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    // Check for saved session on mount
    useEffect(() => {
        const savedUserId = localStorage.getItem('club7_user_id');
        if (savedUserId) {
            getMembers().then((membersData) => {
                const user = membersData.find(m => m.id === savedUserId);
                if (user) {
                    setCurrentUser(user);
                    setIsAuthenticated(true);
                    setMembers(membersData);
                }
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, []);

    // Set up realtime subscriptions
    useEffect(() => {
        if (!isAuthenticated) return;

        const messagesChannel = subscribeToMessages((newMessage) => {
            setMessages(prev => [...prev, newMessage]);
        });

        const postsChannel = subscribeToPosts((newPost) => {
            setPosts(prev => [newPost, ...prev]);
        });

        // Initial data load
        refreshData();

        return () => {
            messagesChannel.unsubscribe();
            postsChannel.unsubscribe();
        };
    }, [isAuthenticated, refreshData]);

    // Actions
    const login = async (pin: string, memberId: string): Promise<boolean> => {
        const isValid = await verifyClubPin(pin);
        if (!isValid) return false;

        const membersData = await getMembers();
        const user = membersData.find(m => m.id === memberId);
        if (!user) return false;

        setCurrentUser(user);
        setIsAuthenticated(true);
        setMembers(membersData);
        localStorage.setItem('club7_user_id', user.id);

        return true;
    };

    const logout = () => {
        setCurrentUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('club7_user_id');
    };

    const addNewPost = async (
        type: 'image' | 'video',
        file: File,
        caption: string,
        stickers?: string[]
    ): Promise<boolean> => {
        if (!currentUser) return false;

        const url = await uploadMedia(file, 'posts');
        if (!url) return false;

        const post = await createPost(currentUser.id, type, url, caption, stickers);
        if (post) {
            setPosts(prev => [post, ...prev]);
            return true;
        }
        return false;
    };

    const addNewPostFromUrl = async (
        type: 'image' | 'video',
        url: string,
        caption: string,
        stickers?: string[]
    ): Promise<boolean> => {
        if (!currentUser) return false;

        const post = await createPost(currentUser.id, type, url, caption, stickers);
        if (post) {
            setPosts(prev => [post, ...prev]);
            return true;
        }
        return false;
    };

    const sendNewMessage = async (
        type: 'text' | 'image' | 'audio' | 'sticker',
        content?: string,
        file?: File
    ): Promise<boolean> => {
        if (!currentUser) return false;

        // Optimistic update - show message immediately
        const tempId = `temp_${Date.now()}`;
        const optimisticMessage = {
            id: tempId,
            user_id: currentUser.id,
            type,
            content: content || null,
            media_url: null,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisticMessage]);

        let mediaUrl: string | undefined;
        if (file) {
            mediaUrl = await uploadMedia(file, 'chat') || undefined;
        }

        const message = await sendMessage(currentUser.id, type, content, mediaUrl);
        if (message) {
            // Replace optimistic message with real one (or realtime will handle it)
            setMessages(prev => prev.map(m => m.id === tempId ? message : m));
            return true;
        } else {
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
        return false;
    };

    const completeMissionAction = async (missionId: string): Promise<boolean> => {
        if (!currentUser) return false;

        const mission = missions.find(m => m.id === missionId);
        if (!mission) return false;

        const success = await completeMission(currentUser.id, missionId, mission);
        if (success) {
            setMissionProgress(prev => [
                ...prev.filter(p => p.mission_id !== missionId),
                {
                    id: `temp_${Date.now()}`,
                    user_id: currentUser.id,
                    mission_id: missionId,
                    completed: true,
                    completed_at: new Date().toISOString()
                }
            ]);

            // Refresh user data to get updated XP
            const membersData = await getMembers();
            const updatedUser = membersData.find(m => m.id === currentUser.id);
            if (updatedUser) {
                setCurrentUser(updatedUser);
                setMembers(membersData);
            }
        }
        return success;
    };

    const toggleReaction = async (postId: string, emoji: string): Promise<void> => {
        if (!currentUser) return;

        const currentReactions = postReactions[postId] || [];
        const hasReaction = currentReactions.includes(emoji);

        if (hasReaction) {
            // Remove reaction (in real app, would call removeReaction)
            setPostReactions(prev => ({
                ...prev,
                [postId]: prev[postId].filter(e => e !== emoji)
            }));
        } else {
            await addReaction(postId, currentUser.id, emoji);
            setPostReactions(prev => ({
                ...prev,
                [postId]: [...(prev[postId] || []), emoji]
            }));
        }
    };

    const getMemberById = (id: string): ClubMember | undefined => {
        return members.find(m => m.id === id);
    };

    const updateAvatar = async (avatarUrl: string): Promise<boolean> => {
        if (!currentUser) return false;

        const updated = await updateMemberAvatar(currentUser.id, avatarUrl);
        if (updated) {
            setCurrentUser(updated);
            setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
            return true;
        }
        return false;
    };

    const value: StoreState = {
        isAuthenticated,
        currentUser,
        members,
        posts,
        messages,
        missions,
        missionProgress,
        postReactions,
        isLoading,
        login,
        logout,
        refreshData,
        addNewPost,
        addNewPostFromUrl,
        sendNewMessage,
        completeMissionAction,
        toggleReaction,
        getMemberById,
        updateAvatar,
    };

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
};
