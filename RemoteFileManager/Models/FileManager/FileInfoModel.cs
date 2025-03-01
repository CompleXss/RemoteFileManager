﻿namespace RemoteFileManager.Models.FileManager;

public readonly struct FileInfoModel(string name, DateTime lastModifiedTime)
{
	public string Name { get; init; } = name;
	public DateTime LastModifiedTime { get; init; } = lastModifiedTime;
}
