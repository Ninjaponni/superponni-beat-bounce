
// Update the playMusic call to match the expected parameters
            try {
              const audioManager = AudioManager.getInstance();
              audioManager.playMusic('music', 0.7);
            } catch (error) {
              console.error("Failed to start music:", error);
            }
