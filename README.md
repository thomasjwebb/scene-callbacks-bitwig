Scene Support for Bitwig
========================

Introduction
------------

As of when this was created, [Bitwig](http://www.bitwig.com) doesn't have callbacks in the control
script javascript api to see if a scene is playing or being queued for playing. To allow controller
scripts to support this until they add that support, this was created to basically fulfill that purpose.

The concept is by design very simple and the behavior isn't perfect in all cases. I didn't want to put
too much effort into code that I hope to not need sooner rather than later. And more complex code can
have more bugs in it anyway. They behavior is basically:

* If all clips in the scene (row) in the trackview you're using that have content are playing and no other scene contains
playing tracks, then the scene is considered to be playing
* If all clips in the scene in the trackview you're using that have content are queued and no other scene contains queued
tracks, then the scene is considered to be queued
* If there are no clips with content in the scene, then the scene isn't considered to be queued or playing

Sometimes, this leads to unexpected behavior. If all tracks but one are playing and you start to play that track, the
scene won't look like it's queued. It will just go from nothing to playing once that track starts playing. Again, I
don't feel like making this more sophisticated and I feel that's Bitwig's job but if you want to enhance, feel free
and send me the pull request.

Usage
-----

You can use this as a submodule or just manually copy the file since it's only one javascript file.
If you use a submodule add the path before scene.js accordingly below.

    load('scene.js');

Since we're not allowed by the interface to just attach arbitrary functions to objects that exist
in Bitwig's Java, we must create a new object that has the callback register functions on it, which
I'll call a "fake" ClipLauncherScenes object:

    fakeClipLauncherScenes = addSceneStateCallbacks(main_track_bank, grid_width, grid_height);

There are then two functions you can use to add observers and get feedback when this script thinks
a scene is playing or queued.

    fakeClipLauncherScenes.addIsPlayingObserver(function(scene, playing)
    {
        // Do something here like lighting up your scene launcher button
    });

    fakeClipLauncherScenes.addIsQueuedObserver(function(scene, queued)
    {
        // Do something here like making your scene launcher button blink
    });

That's all there is to it. Let me know if you find serious bugs.

License
-------

This is licensed under the very permissive BSD license. See LICENSE for more details.
Copyright 2014 Osaka Red LLC and Thomas J. Webb
