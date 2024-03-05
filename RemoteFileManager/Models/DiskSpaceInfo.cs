namespace RemoteFileManager.Models;

public readonly struct DiskSpaceInfo
{
	public long Free { get; init; }
	public long Total { get; init; }

	public DiskSpaceInfo(long free, long total) : this()
	{
		Free = free;
		Total = total;
	}
}
