
// You give this function a track bank, it will listen to changes on that track bank
// and add functions to its ClipLauncherScenesOrSlots that register callbacks, which the objects
// here will call, namely addIsPlayingObserver and addIsQueuedObserver
function addSceneStateCallbacks(track_bank, num_tracks, num_scenes)
{
	// Each scene is an object with some metadata on it and an array of clips
	// I'm basically getting the 2D array Bitwig gives me and flipping it
	scenes = [];

	// Callbacks that have been registered
	is_playing_observers = [];
	is_queued_observers = [];

	for (int track_index = 0; track_index < num_tracks; ++num_tracks)
	{
		track = track_index.getTrack(track_index);
		for (int scene_index = 0; scene_index < num_scenes; ++scene_index)
		{
			// The first time through the outer loop, we want to start creating our scene objects
			if (track_index == 0)
			{
				scene = scenes[scene_index] = {};
				// All four of these indicate that all clips with content are in given state
				// and in the case of the first two, the remainder are the latter two
				scene.all_playing = false;
				scene.all_queued = false;
				scene.all_stopped = false;
				scene.all_not_queued = false;
				scene.clips = [];

				scene.updateState = function()
				{
					all_playing = true;
					all_queued = true;
					all_stopped = true;
					all_not_queued = true;
					for (i = 0; i < num_tracks; ++i)
					{
						clip = scene.clips[i];
						// Doesn't have anything, skip
						if (!clip.has_content) continue;
						if (clip.playing) all_stopped = false;
						else all_playing = false;
						if (clip.queued) all_not_queued = false;
						else all_queued = false;
					}

					// Still think you're all_playing? Not if other tracks aren't stopped
					if (all_playing)
					{
						for (i = 0; i < num_scenes; ++i)
						{
							// Skip if it's me
							if (i == scene_index) continue;
							if (!scenes[i].all_stopped)
							{
								all_playing = false;
								break;
							}
						}
					}

					// Okay, still think you're all_queued?
					if (all_queued)
					{
						for (i = 0; i < num_scenes; ++i)
						{
							if (i == scene_index) continue;
							if (!scenes[i].all_not_queued)
							{
								all_queued = false;
								break;
							}
						}
					}

					// Time to update the scene variables and dispatch to listeners as need be
					if (scene.all_playing != all_playing)
					{
						for (i = 0; i < is_playing_observers.length; ++i)
						{
							is_playing_observers[i](scene_index, all_playing);
						}
						scene.all_playing = all_playing;
					}

					if (scene.all_queued != all_queued)
					{
						for (i = 0; i < is_queued_observers.length; ++i)
						{
							is_queued_observers[i](scene_index, all_queued);
						}
						scene.all_queued = all_queued;
					}
				}
			}
			scene = scenes[scene_index];
			clip = scene.clips[track_index] = {};
			clip.has_content = false;
			clip.playing = false;
			clip.queued = false;

			// Add the listeners for the clip, which duly call its scene's updateClip()
		}
	}

	// Add addPlayingObserver or addMatrixPlayingObserver &c. to the trackbank's scene launcher
}