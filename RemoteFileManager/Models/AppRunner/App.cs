using System.Diagnostics;
using System.Runtime.Serialization;
using System.Text.Json.Serialization;

namespace RemoteFileManager.Models.AppRunner;

public class App
{
	public Process Process { get; set; }

	private States state;

	public States State
	{
		get => state;
		set
		{
			if (state != value)
				StateChanged?.Invoke(value);

			state = value;
		}
	}

	public event Action<States>? StateChanged;


	public App(Process process)
	{
		this.Process = process;
	}

	public App(Process process, States state)
	{
		this.Process = process;
		this.State = state;
	}

	[DataContract]
	[JsonConverter(typeof(JsonStringEnumConverter))]
	public enum States
	{
		[EnumMember(Value = "Stopped")]
		Stopped,

		[EnumMember(Value = "Running")]
		Running,
	}
}
