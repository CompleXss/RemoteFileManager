namespace RemoteFileManager.Extensions;

public static class Helpers
{
	/// <returns>
	/// Function that starts a timer that waits for the <paramref name="milliseconds"/> debounce time.<br/>
	/// If this function is called again before the timer expires, the timer is reset.<br/>
	/// If the timer expires without the function being called again, it calls the original <paramref name="func"/>.
	/// </returns>
	public static Action<T> Debounce<T>(Action<T> func, int milliseconds = 300)
	{
		int last = 0;

		return x =>
		{
			int current = Interlocked.Increment(ref last);

			Task.Delay(milliseconds).ContinueWith(task =>
			{
				if (current == last) func(x);
				task.Dispose();
			});
		};
	}

	/// <returns>
	/// Function that starts a timer that waits for the <paramref name="milliseconds"/> debounce time.<br/>
	/// If this function is called again before the timer expires, the timer is reset.<br/>
	/// If the timer expires without the function being called again, it calls the original <paramref name="func"/>.
	/// </returns>
	public static Action<T1, T2> Debounce<T1, T2>(Action<T1, T2> func, int milliseconds = 300)
	{
		int last = 0;

		return (x1, x2) =>
		{
			int current = Interlocked.Increment(ref last);

			Task.Delay(milliseconds).ContinueWith(task =>
			{
				if (current == last) func(x1, x2);
				task.Dispose();
			});
		};
	}
}
