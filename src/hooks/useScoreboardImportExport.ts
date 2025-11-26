import { TauriAPI } from '../lib/tauri';
import { useScoreboardStore } from '../stores/useScoreboardStore';
import { useImageStore } from '../stores/useImageStore';

/**
 * Hook that provides functions for importing and exporting scoreboards.
 * 
 * Export functionality:
 * - Saves scoreboard to disk
 * - Packages scoreboard with all assets (images, videos) into a ZIP file
 * - Allows user to choose save location
 * 
 * Import functionality:
 * - Reads ZIP file from user's file system
 * - Extracts scoreboard data and assets
 * - Loads scoreboard into the designer
 * 
 * @param config - The current scoreboard config
 * @param components - The current scoreboard components
 * @returns Object with export and import handler functions
 */
export const useScoreboardImportExport = (config: any, components: any[]) => {
  /**
   * Exports the current scoreboard design as a ZIP file.
   * The ZIP includes the scoreboard JSON and all referenced assets.
   * 
   * Process:
   * 1. Shows a save dialog to choose file location
   * 2. Saves scoreboard to disk first (required for export)
   * 3. Exports scoreboard as ZIP data
   * 4. Writes ZIP data to chosen file path
   * 5. Marks scoreboard as saved
   * 
   * @throws Error if export fails (shows alert to user)
   */
  const handleExportScoreboard = async () => {
    if (!config) {
      alert('Please create a scoreboard design before exporting.');
      return;
    }

    try {
      // Import save dialog from Tauri
      const { save } = await import('@tauri-apps/plugin-dialog');
      
      // Show save dialog
      const filePath = await save({
        defaultPath: `${config.name}_export.zip`,
        filters: [
          {
            name: 'ZIP Files',
            extensions: ['zip']
          }
        ]
      });

      // User cancelled the dialog
      if (!filePath) {
        return;
      }

      // First, ensure the scoreboard is saved to disk before exporting
      const saveData = {
        ...config,
        components: components
      };

      // Save the scoreboard to disk first
      const filename = await TauriAPI.saveScoreboard(config.name, saveData);
      console.log('📁 Scoreboard saved to disk for export:', filename);
      
      // Now export the saved scoreboard as zip data
      const zipData = await TauriAPI.exportScoreboardAsZip(filename);
      
      // Write the zip data directly to the chosen file path
      const { writeFile } = await import('@tauri-apps/plugin-fs');
      await writeFile(filePath, new Uint8Array(zipData));
      
      // Mark as saved since we just saved it
      const { markSaved } = useScoreboardStore.getState();
      markSaved();
      
      alert(`Scoreboard "${config.name}" exported successfully to:\n${filePath}`);
    } catch (error) {
      console.error('Failed to export scoreboard:', error);
      alert('Failed to export scoreboard. Please try again.');
    }
  };

  /**
   * Imports a scoreboard from a ZIP file.
   * 
   * Process:
   * 1. Creates a hidden file input element
   * 2. Triggers file selection dialog
   * 3. Reads ZIP file as array buffer
   * 4. Imports scoreboard data from ZIP
   * 5. Loads scoreboard into designer
   * 6. Refreshes image store to load imported images
   * 
   * @throws Error if import fails (shows alert to user)
   */
  const handleImportScoreboard = async () => {
    try {
      // Create file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.zip';
      input.style.display = 'none';
      
      // Handle file selection
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        try {
          // Read file as array buffer
          const arrayBuffer = await file.arrayBuffer();
          const zipData = Array.from(new Uint8Array(arrayBuffer));
          
          // Import the scoreboard
          const importedTauriConfig = await TauriAPI.importScoreboardFromZip(zipData);
          
          // Convert TauriScoreboardConfig to ScoreboardConfig format
          const importedConfig = {
            ...importedTauriConfig.data,
            id: importedTauriConfig.id,
            name: importedTauriConfig.name,
          };
          
          // Load the imported scoreboard into the designer
          const { loadScoreboard } = useScoreboardStore.getState();
          await loadScoreboard(importedConfig);
          
          // Refresh images
          const { loadImages } = useImageStore.getState();
          await loadImages();
          
          alert(`Scoreboard "${importedConfig.name}" imported successfully!`);
        } catch (error) {
          console.error('Failed to import scoreboard:', error);
          alert('Failed to import scoreboard. Please ensure the file is a valid scoreboard ZIP.');
        } finally {
          // Clean up
          document.body.removeChild(input);
        }
      };
      
      // Trigger file dialog
      document.body.appendChild(input);
      input.click();
    } catch (error) {
      console.error('Failed to open file dialog:', error);
      alert('Failed to open file dialog. Please try again.');
    }
  };

  return {
    handleExportScoreboard,
    handleImportScoreboard
  };
};
