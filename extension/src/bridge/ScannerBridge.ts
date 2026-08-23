import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { Logger } from '../utils/logger';
import { ScanResult } from '../models/scanResult';
import { parseScanResult, extractErrorMessage } from './resultParser';

export class ScannerBridgeError extends Error {}

export class ScannerBridge {
  constructor(private readonly extensionUri: vscode.Uri) {}

  public async run(targetPath: string): Promise<ScanResult> {
    const pythonPath = this.getConfiguredPythonPath();
    const engineDir = this.resolveEngineDirectory();

    Logger.info(`Running scan via bridge: ${pythonPath} -m sentricodex --path ${targetPath}`);

    const { stdout, stderr, exitCode } = await this.spawnProcess(
      pythonPath,
      ['-m', 'sentricodex', '--path', targetPath],
      engineDir
    );

    if (exitCode !== 0) {
      const message = extractErrorMessage(stderr) ?? `Scan process exited with code ${exitCode}.`;
      throw new ScannerBridgeError(message);
    }

    return this.parseResult(stdout);
  }

  private getConfiguredPythonPath(): string {
    const config = vscode.workspace.getConfiguration('sentricodex');
    return config.get<string>('pythonPath', 'python');
  }

  private resolveEngineDirectory(): string {
    const bundledPath = path.join(this.extensionUri.fsPath, 'bundled', 'engine');
    if (fs.existsSync(bundledPath)) {
      Logger.info(`Using bundled engine at: ${bundledPath}`);
      return bundledPath;
    }

    const devPath = path.join(this.extensionUri.fsPath, '..', 'engine');
    if (fs.existsSync(devPath)) {
      Logger.info(`Using development engine at: ${devPath}`);
      return devPath;
    }

    throw new ScannerBridgeError(
      'Could not locate the SentriCodeX Python engine (checked both the ' +
        'bundled and development locations). This installation may be corrupted.'
    );
  }

  private spawnProcess(
    command: string,
    args: string[],
    engineDir: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        shell: false,
        env: { ...process.env, PYTHONPATH: engineDir },
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf8');
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString('utf8');
      });

      child.on('error', (err: Error) => {
        reject(
          new ScannerBridgeError(
            `Could not start Python ('${command}'). Confirm Python is installed ` +
              `and the "sentricodex.pythonPath" setting is correct. (${err.message})`
          )
        );
      });

      child.on('close', (code: number | null) => {
        resolve({ stdout, stderr, exitCode: code });
      });
    });
  }

  private parseResult(stdout: string): ScanResult {
    try {
      return parseScanResult(stdout);
    } catch (err) {
      Logger.error('Failed to parse scan result JSON', err);
      throw new ScannerBridgeError(
        'The scan completed but its output could not be parsed. See the ' +
          'SentriCodeX output channel for details.'
      );
    }
  }
}
