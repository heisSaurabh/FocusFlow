import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Global auth state using Zustand with localStorage persistence.
 * Stores JWT tokens and user profile.
 */
export const useAuthStore = create(
    persist(
        (set, get) => ({
            accessToken: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,

            // Set tokens after login/register
            setTokens: (accessToken, refreshToken) =>
                set({ accessToken, refreshToken }),

            // Set user profile after login
            setUser: (user) =>
                set({ user, isAuthenticated: true }),

            // Called after successful login with full response
            login: (jwtResponse) =>
                set({
                    accessToken: jwtResponse.accessToken,
                    refreshToken: jwtResponse.refreshToken,
                    user: {
                        id: jwtResponse.userId,
                        name: jwtResponse.name,
                        email: jwtResponse.email,
                        roles: jwtResponse.roles,
                    },
                    isAuthenticated: true,
                }),

            // Clear all auth state
            logout: () =>
                set({
                    accessToken: null,
                    refreshToken: null,
                    user: null,
                    isAuthenticated: false,
                }),

            // Check if user has admin role
            isAdmin: () => {
                const { user } = get()
                return user?.roles?.includes('ROLE_ADMIN') ?? false
            },
        }),
        {
            name: 'timetable-auth', // localStorage key
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)
