using System.Runtime.Serialization;

namespace RemoteFileManager.Models.AppRunner;

[DataContract]
public record AppStateDto(App.States? State, string[] Logs);
