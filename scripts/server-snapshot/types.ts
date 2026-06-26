export interface SnapshotContext {
  repoRoot: string;
  outputPath: string;
  lines: string[];
  problems: string[];
  envValues: Map<string, string>;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
}

export interface PathStat {
  path: string;
  exists: boolean;
  size?: string;
  mtime?: Date;
  isDirectory?: boolean;
}

export interface ParsedDatabaseUrl {
  host?: string;
  port?: string;
  database?: string;
  user?: string;
  raw?: string;
  error?: string;
}
