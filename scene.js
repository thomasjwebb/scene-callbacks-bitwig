
function prepareClip(clip, track, scenes)
{
	// The listeners are per track but we're interested in scene
	clip_launcher = track.getClipLauncherSlots();

	clip.content_observer = function(slot, has_content)
	{
		scene = scenes[slot];
		sub_clip = scene.clips[clip.track_index];
		sub_clip.has_content = has_content;
		scene.updateState();
	}
	clip_launcher.addHasContentObserver(clip.content_observer);
	
	clip.playing_observer = function(slot, playing)
	{
		scene = scenes[slot];
		sub_clip = scene.clips[clip.track_index];
		sub_clip.playing = playing;
		scene.updateState();
	}
	clip_launcher.addIsPlayingObserver(clip.playing_observer);

	clip.queued_observer = function(slot, queued)
	{
		scene = scenes[slot];
		sub_clip = scene.clips[clip.track_index];
		sub_clip.queued = queued;
		scene.updateState();
	}
	clip_launcher.addIsQueuedObserver(clip.queued_observer);
}

function prepareScene(scene, num_tracks)
{
	// All four of these indicate that all clips with content are in given state
	// and in the case of the first two, the remainder are the latter two
	scene.all_playing = false;
	scene.all_queued = false;
	scene.clips = [];

	scene.updateState = function()
	{
		all_playing = true;
		all_queued = true;
		all_empty = true;
		for (i = 0; i < num_tracks; ++i)
		{
			clip = scene.clips[i];
			// Doesn't have anything, skip
			if (clip.has_content) all_empty = false;
			else continue;
			if (!clip.playing) all_playing = false;
			if (!clip.queued) all_queued = false;
		}

		// Can't be all_playing or all_queued if all_empty
		if (all_empty)
		{
			all_playing = all_queued = false;
		}

		// Still think you're all_playing? Not if other tracks aren't stopped
		// if (all_playing)
		// {
		// 	for (i = 0; i < num_scenes; ++i)
		// 	{
		// 		// Skip if it's me
		// 		if (i == scene_index) continue;
		// 		if (!scenes[i].all_stopped)
		// 		{
		// 			all_playing = false;
		// 			break;
		// 		}
		// 	}
		// }

		// // Okay, still think you're all_queued?
		// if (all_queued)
		// {
		// 	for (i = 0; i < num_scenes; ++i)
		// 	{
		// 		if (i == scene_index) continue;
		// 		if (!scenes[i].all_not_queued)
		// 		{
		// 			all_queued = false;
		// 			break;
		// 		}
		// 	}
		// }

		// Time to update the scene variables and dispatch to listeners as need be
		if (scene.all_playing != all_playing)
		{
			for (i = 0; i < is_playing_observers.length; ++i)
			{
				is_playing_observers[i](scene.index, all_playing);
			}
			scene.all_playing = all_playing;
		}

		if (scene.all_queued != all_queued)
		{
			for (i = 0; i < is_queued_observers.length; ++i)
			{
				is_queued_observers[i](scene.index, all_queued);
			}
			scene.all_queued = all_queued;
		}
	}
}

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

	for (track_index = 0; track_index < num_tracks; ++track_index)
	{
		track = track_bank.getTrack(track_index);
		for (scene_index = 0; scene_index < num_scenes; ++scene_index)
		{
			// The first time through the outer loop, we want to start creating our scene objects
			if (track_index == 0)
			{
				scene = scenes[scene_index] = {};
				scene.index = scene_index;
				prepareScene(scene, num_tracks);
			}
			scene = scenes[scene_index];
			clip = scene.clips[track_index] = {};
			clip.has_content = false;
			clip.playing = false;
			clip.queued = false;
			clip.track_index = track_index;

			// Put a listener on the first clip in a given track

			if (scene_index == 0)
			{
				prepareClip(clip, track, scenes);
			}
		}
	}

	// Since we can't just attach this to the ClipLauncherScenesOrSlots object like I'd like to
	// (because of Java's rules, not because of JavaScrtipt's), we'll have to make our own object
	// and return
	fake_clip_launcher_scenes = {};

	fake_clip_launcher_scenes.addIsPlayingObserver = function(callable)
	{
		is_playing_observers.push(callable);

		for (scene_index = 0; scene_index < num_scenes; ++scene_index)
		{
			scene = scenes[scene_index];
			callable(scene_index, scene.all_playing);
		}
	}

	fake_clip_launcher_scenes.addIsQueuedObserver = function(callable)
	{
		is_queued_observers.push(callable);

		for (scene_index = 0; scene_index < num_scenes; ++scene_index)
		{
			scene = scenes[scene_index];
			callable(scene_index, scene.all_queued);
		}
	}

	return fake_clip_launcher_scenes;
}