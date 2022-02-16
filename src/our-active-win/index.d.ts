declare namespace ourActiveWin {
  interface BaseOwner {
    /**
		Process identifier
		*/
    processId: number;
  }

  interface BaseResult {
    /**
		Window identifier.

		On Windows, there isn't a clear notion of a "Window ID". Instead it returns the memory address of the window "handle" in the `id` property. That "handle" is unique per window, so it can be used to identify them. [Read more…](https://msdn.microsoft.com/en-us/library/windows/desktop/ms632597(v=vs.85).aspx#window_handle).
		*/
    id: number;

    /**
		Window position and size.
		*/
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };

    /**
		App that owns the window.
		*/
    owner: BaseOwner;
    admin: boolean;
    cantDoInjection: boolean;
  }

  interface MacOSOwner extends BaseOwner {
    name: string | undefined;
    bundleId: string | undefined;
    path: string | undefined;
  }

  interface MacOSResult extends BaseResult {
    platform: 'macos';

    title: string | undefined;
    owner: MacOSOwner;
  }

  interface WindowsResult extends BaseResult {
    platform: 'windows';
    title: string | undefined;
  }

  type Result = MacOSResult | WindowsResult;
}

declare const ourActiveWin: {
  /**
	Synchronously get metadata about the [active window](https://en.wikipedia.org/wiki/Active_window) (title, id, bounds, owner, etc).

	@returns The active window metadata.

	@example
	```
	import activeWin = require('active-win');

	const result = activeWin.sync();

	if (result) {
		if (result.platform === 'macos') {
			// Among other fields, result.owner.bundleId is available on macOS.
			console.log(`Process title is ${result.title} with bundle id ${result.owner.bundleId}.`);
		} else if (result.platform === 'windows') {
			console.log(`Process title is ${result.title} with path ${result.owner.path}.`);
		} else {
			console.log(`Process title is ${result.title} with path ${result.owner.path}.`);
		}
	}
	```
	*/
  sync(): ourActiveWin.Result | undefined;
  /**Get stream 
  @returns The active window metadata.*/

  launch(justEmbed?: boolean): import('child_process').ChildProcessWithoutNullStreams | undefined;
};

export = ourActiveWin;
