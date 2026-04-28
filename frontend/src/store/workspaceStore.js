import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Global workspace state for v3.0.
 * Tracks the currently active workspace to filter data.
 */
export const useWorkspaceStore = create(
    persist(
        (set) => ({
            activeWorkspace: null, // Workspace object or null (Default/Personal)
            workspaces: [],

            setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
            setWorkspaces: (workspaces) => set({ workspaces }),
            
            clear: () => set({ activeWorkspace: null, workspaces: [] })
        }),
        {
            name: 'timetable-workspace'
        }
    )
)
