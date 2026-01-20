import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    supabase,
    ClubMember,
    Post,
    Message,
    Mission,
    MissionProgress,
    Reaction,
    Comment,
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
    removeReaction,
    getReactionsForPost,
    getCommentsForPost,
    addComment,
    subscribeToMessages,
    subscribeToPosts,
    subscribeToMessageDeletes,
    subscribeToPostDeletes,
    subscribeToComments,
    subscribeToCommentDeletes,
    subscribeToReactions,
    updateMemberAvatar,
    deleteMessage as deleteMessageApi,
    deletePost as deletePostApi,
    deleteComment as deleteCommentApi,
    createMember,
    updateMemberDetails,
    deleteMember as deleteMemberApi,
    Event,
    getEvents,
    createEvent,
    deleteEvent,
    subscribeToEvents,
    subscribeToEventDeletes,
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
    postReactions: Record<string, Reaction[]>; // postId -> array of Reaction objects with user_id
    postComments: Record<string, Comment[]>; // postId -> array of comments
    events: Event[];

    // Loading states
    isLoading: boolean;

    // Actions
    login: (password: string, memberId: string) => Promise<boolean>;
    logout: () => void;
    refreshData: (silent?: boolean) => Promise<void>;
    addNewPost: (type: 'image' | 'video', file: File, caption: string, stickers?: string[]) => Promise<boolean>;
    addNewPostFromUrl: (type: 'image' | 'video', url: string, caption: string, stickers?: string[]) => Promise<boolean>;
    sendNewMessage: (type: 'text' | 'image' | 'audio' | 'sticker', content?: string, file?: File) => Promise<boolean>;
    completeMissionAction: (missionId: string, targetUserId?: string) => Promise<boolean>;
    toggleReaction: (postId: string, emoji: string) => Promise<void>;
    addCommentAction: (postId: string, content: string) => Promise<boolean>;
    getMemberById: (id: string) => ClubMember | undefined;
    updateAvatar: (avatarUrl: string) => Promise<boolean>;
    deleteMessageAction: (messageId: string) => Promise<boolean>;
    deletePostAction: (postId: string) => Promise<boolean>;
    deleteCommentAction: (commentId: string, postId: string) => Promise<boolean>;
    addNewMember: (name: string) => Promise<ClubMember | null>;
    updateMember: (id: string, updates: Partial<ClubMember>) => Promise<boolean>;
    deleteMemberAction: (id: string) => Promise<boolean>;
    addEventAction: (event: Omit<Event, 'id' | 'created_at'>, shouldCreatePost?: boolean) => Promise<boolean>;
    deleteEventAction: (id: string) => Promise<boolean>;
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
    const [postReactions, setPostReactions] = useState<Record<string, Reaction[]>>({});
    const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load all data
    const refreshData = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const membersData = await getMembers();
            setMembers(membersData);

            if (isAuthenticated) {
                const [postsData, messagesData, missionsData, eventsData] = await Promise.all([
                    getPosts(),
                    getMessages(),
                    getMissions(),
                    getEvents()
                ]);

                setPosts(postsData);
                setMessages(messagesData);
                setMissions(missionsData);
                setEvents(eventsData);

                // Load reactions for all posts (now with full Reaction objects including user_id)
                const reactionsMap: Record<string, Reaction[]> = {};
                const commentsMap: Record<string, Comment[]> = {};
                for (const post of postsData) {
                    const reactions = await getReactionsForPost(post.id);
                    reactionsMap[post.id] = reactions;
                    const comments = await getCommentsForPost(post.id);
                    commentsMap[post.id] = comments;
                }
                setPostReactions(reactionsMap);
                setPostComments(commentsMap);

                // Load mission progress for current user
                if (currentUser) {
                    const progress = await getMissionProgress(currentUser.id);
                    setMissionProgress(progress);
                }
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [isAuthenticated, currentUser]);

    // Check for saved session on mount
    useEffect(() => {
        const savedUserId = localStorage.getItem('bestiesocial_user_id');
        if (savedUserId) {
            getMembers().then((membersData) => {
                const user = membersData.find(m => m.id === savedUserId);
                if (user) {
                    setCurrentUser(user);
                    setIsAuthenticated(true);
                    setMembers(membersData);
                } else {
                    // Start fresh if user not found, but keep members loaded
                    setMembers(membersData);
                }
                setIsLoading(false);
            });
        } else {
            // No session, but we still need members for the login screen
            getMembers().then((membersData) => {
                setMembers(membersData);
                setIsLoading(false);
            });
        }
    }, []);

    // Set up realtime subscriptions
    useEffect(() => {
        if (!isAuthenticated) return;

        const messagesChannel = subscribeToMessages((newMessage) => {
            setMessages(prev => {
                // Check if message already exists (avoid duplicates from optimistic updates)
                const exists = prev.some(m => m.id === newMessage.id);
                if (exists) return prev;
                return [...prev, newMessage];
            });
        });

        const postsChannel = subscribeToPosts((newPost) => {
            setPosts(prev => {
                // Check if post already exists (avoid duplicates from optimistic updates)
                const exists = prev.some(p => p.id === newPost.id);
                if (exists) return prev;
                return [newPost, ...prev];
            });
        });

        // Subscribe to deletes for realtime sync
        const messagesDeleteChannel = subscribeToMessageDeletes((messageId) => {
            setMessages(prev => prev.filter(m => m.id !== messageId));
        });

        const postsDeleteChannel = subscribeToPostDeletes((postId) => {
            setPosts(prev => prev.filter(p => p.id !== postId));
        });

        // Subscribe to comments realtime
        const commentsChannel = subscribeToComments((newComment) => {
            console.log('[REALTIME] New comment received:', newComment);
            // Comments are refreshed when viewing a post, we just log here
        });

        const commentsDeleteChannel = subscribeToCommentDeletes((commentId) => {
            console.log('[REALTIME] Comment deleted:', commentId);
            // Comments will refresh when viewing a post
        });

        // Subscribe to reactions realtime
        const reactionsChannel = subscribeToReactions((reaction, eventType) => {
            console.log('[REALTIME] Reaction event:', eventType, reaction);
            // Reactions are refreshed per-post basis
        });

        // Subscribe to events
        const eventsChannel = subscribeToEvents((newEvent) => {
            setEvents(prev => {
                const exists = prev.some(e => e.id === newEvent.id);
                if (exists) return prev;
                return [...prev, newEvent].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
            });
        });

        const eventsDeleteChannel = subscribeToEventDeletes((eventId) => {
            setEvents(prev => prev.filter(e => e.id !== eventId));
        });

        // Initial data load
        refreshData();

        return () => {
            messagesChannel.unsubscribe();
            postsChannel.unsubscribe();
            messagesDeleteChannel.unsubscribe();
            postsDeleteChannel.unsubscribe();
            commentsChannel.unsubscribe();
            commentsDeleteChannel.unsubscribe();
            reactionsChannel.unsubscribe();
            eventsChannel.unsubscribe();
            eventsDeleteChannel.unsubscribe();
        };
    }, [isAuthenticated, refreshData]);

    // Helper function to award XP and recalculate level
    const awardXP = async (userId: string, amount: number) => {
        const member = members.find(m => m.id === userId);
        if (!member) return;

        const newXP = (member.xp || 0) + amount;
        const newLevel = Math.floor(newXP / 1000) + 1;

        const updated = await updateMemberDetails(userId, { xp: newXP, level: newLevel });
        if (updated) {
            setMembers(prev => prev.map(m => m.id === userId ? updated : m));
            if (currentUser && currentUser.id === userId) {
                setCurrentUser(updated);
            }
        }
    };

    // Actions
    const login = async (password: string, memberId: string): Promise<boolean> => {
        // Find member (ensure we have members loaded)
        let member = members.find(m => m.id === memberId);
        if (!member) {
            const allMembers = await getMembers();
            setMembers(allMembers);
            member = allMembers.find(m => m.id === memberId);
        }

        if (!member) return false;

        // Verify password against database
        try {
            const { data, error } = await supabase
                .from('club_members')
                .select('password')
                .eq('id', memberId)
                .single();

            if (error || !data) return false;

            // Simple string comparison for the PIN system
            if (data.password === password) {
                setCurrentUser(member);
                setIsAuthenticated(true);
                localStorage.setItem('bestiesocial_user_id', member.id);

                // Award 100 XP for opening the app (login)
                const newXP = (member.xp || 0) + 100;
                const newLevel = Math.floor(newXP / 1000) + 1;
                updateMemberDetails(member.id, { xp: newXP, level: newLevel }).then(updated => {
                    if (updated) {
                        setCurrentUser(updated);
                        setMembers(prev => prev.map(m => m.id === member.id ? updated : m));
                    }
                });

                return true;
            }
        } catch (e) {
            console.error('Login error:', e);
        }

        return false;
    };

    const logout = () => {
        setCurrentUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('bestiesocial_user_id');
    };

    const addNewPost = async (
        type: 'image' | 'video',
        file: File,
        caption: string,
        stickers?: string[]
    ): Promise<boolean> => {
        if (!currentUser) return false;

        // Check video limit (max 3 videos per user)
        if (type === 'video') {
            const userVideos = posts.filter(p => p.user_id === currentUser.id && p.type === 'video');
            if (userVideos.length >= 3) {
                alert('¡Máximo 3 videos! Elimina uno de tus videos existentes para subir otro.');
                return false;
            }
        }

        const url = await uploadMedia(file, 'posts');
        if (!url) return false;

        const post = await createPost(currentUser.id, type, url, caption, stickers);
        if (post) {
            setPosts(prev => [post, ...prev]);

            // Award 300 XP for creating a post
            awardXP(currentUser.id, 300);

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

    const completeMissionAction = async (missionId: string, targetUserId?: string): Promise<boolean> => {
        if (!currentUser) return false;

        // Admin can complete missions for other users
        const userId = (currentUser.is_admin && targetUserId) ? targetUserId : currentUser.id;

        const mission = missions.find(m => m.id === missionId);
        if (!mission) return false;

        const success = await completeMission(userId, missionId, mission);
        if (success) {
            setMissionProgress(prev => [
                ...prev.filter(p => !(p.mission_id === missionId && p.user_id === userId)),
                {
                    id: `temp_${Date.now()}`,
                    user_id: userId,
                    mission_id: missionId,
                    completed: true,
                    completed_at: new Date().toISOString()
                }
            ]);

            // Refresh members data to get updated XP for the target user
            const membersData = await getMembers();
            setMembers(membersData);

            // Update currentUser if it's the same user
            if (userId === currentUser.id) {
                const updatedUser = membersData.find(m => m.id === currentUser.id);
                if (updatedUser) {
                    setCurrentUser(updatedUser);
                }
            }
        }
        return success;
    };

    const toggleReaction = async (postId: string, emoji: string): Promise<void> => {
        if (!currentUser) return;

        const currentReactions = postReactions[postId] || [];
        const existingReaction = currentReactions.find(r => r.user_id === currentUser.id && r.emoji === emoji);

        if (existingReaction) {
            // Remove reaction
            await removeReaction(postId, currentUser.id, emoji);
            setPostReactions(prev => ({
                ...prev,
                [postId]: prev[postId].filter(r => !(r.user_id === currentUser.id && r.emoji === emoji))
            }));
        } else {
            // Add reaction
            await addReaction(postId, currentUser.id, emoji);
            const newReaction: Reaction = {
                id: `temp_${Date.now()}`,
                post_id: postId,
                user_id: currentUser.id,
                emoji,
                created_at: new Date().toISOString()
            };
            setPostReactions(prev => ({
                ...prev,
                [postId]: [...(prev[postId] || []), newReaction]
            }));
        }
    };

    const addCommentAction = async (postId: string, content: string): Promise<boolean> => {
        if (!currentUser || !content.trim()) return false;

        const comment = await addComment(postId, currentUser.id, content.trim());
        if (comment) {
            setPostComments(prev => ({
                ...prev,
                [postId]: [...(prev[postId] || []), comment]
            }));
            return true;
        }
        return false;
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

    // Admin actions
    const deleteMessageAction = async (messageId: string): Promise<boolean> => {
        const success = await deleteMessageApi(messageId);
        if (success) {
            setMessages(prev => prev.filter(m => m.id !== messageId));
        }
        return success;
    };

    const deletePostAction = async (postId: string): Promise<boolean> => {
        const success = await deletePostApi(postId);
        if (success) {
            setPosts(prev => prev.filter(p => p.id !== postId));
        }
        return success;
    };

    const deleteCommentAction = async (commentId: string, postId: string): Promise<boolean> => {
        const success = await deleteCommentApi(commentId);
        if (success) {
            // Refresh comments for this post
            const comments = await getCommentsForPost(postId);
            setPostComments(prev => ({ ...prev, [postId]: comments }));
        }
        return success;
    };

    const addNewMember = async (name: string): Promise<ClubMember | null> => {
        const member = await createMember(name);
        if (member) {
            setMembers(prev => [...prev, member]);
        }
        return member;
    };

    const updateMember = async (id: string, updates: Partial<ClubMember>): Promise<boolean> => {
        const updated = await updateMemberDetails(id, updates);
        if (updated) {
            setMembers(prev => prev.map(m => m.id === id ? updated : m));
            if (currentUser && currentUser.id === id) {
                setCurrentUser(updated);
            }
            return true;
        }
        return false;
    };

    const deleteMemberAction = async (id: string): Promise<boolean> => {
        const success = await deleteMemberApi(id);
        if (success) {
            setMembers(prev => prev.filter(m => m.id !== id));
        }
        return success;
    };

    const addEventAction = async (event: Omit<Event, 'id' | 'created_at'>, shouldCreatePost?: boolean): Promise<boolean> => {
        // Use default image if none provided
        const finalEvent = {
            ...event,
            image_url: event.image_url || '/default-event.png'
        };

        const newEvent = await createEvent(finalEvent);
        if (newEvent) {
            setEvents(prev => [...prev, newEvent].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()));

            // Auto-create post if requested
            if (shouldCreatePost && currentUser) {
                try {
                    // Use the event image for the post, or the default banner
                    const imageUrl = newEvent.image_url || '/default-event.png';
                    const caption = `📅 ¡Nuevo evento en la agenda!\n\n${event.emoji} **${event.title}**\n🗓️ ${event.event_date} ${event.event_time ? '⏰ ' + event.event_time : ''}\n${event.location ? '📍 ' + event.location : ''}\n\n${event.description || ''}`;

                    const post = await createPost(currentUser.id, 'image', imageUrl, caption);
                    if (post) {
                        setPosts(prev => [post, ...prev]);
                    }
                } catch (err) {
                    console.error('Error creating auto-post for event:', err);
                }
            }

            return true;
        }
        return false;
    };

    const deleteEventAction = async (id: string): Promise<boolean> => {
        const success = await deleteEvent(id);
        if (success) {
            setEvents(prev => prev.filter(e => e.id !== id));
        }
        return success;
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
        postComments,
        isLoading,
        login,
        logout,
        refreshData,
        addNewPost,
        addNewPostFromUrl,
        sendNewMessage,
        completeMissionAction,
        toggleReaction,
        addCommentAction,
        getMemberById,
        updateAvatar,
        deleteMessageAction,
        deletePostAction,
        deleteCommentAction,
        addNewMember,
        updateMember,
        deleteMemberAction,
        events,
        addEventAction,
        deleteEventAction,
    };

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
};
