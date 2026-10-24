using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text;
using System.Windows.Forms;
using Microsoft.Win32;

[assembly: AssemblyTitle("Unity Asset Trim Setup")]
[assembly: AssemblyDescription("Photoshop batch transparent-edge trimming tool installer")]
[assembly: AssemblyCompany("sakeka56")]
[assembly: AssemblyProduct("Unity Asset Trim")]
[assembly: AssemblyCopyright("Copyright (c) 2026 sakeka56")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

namespace UnityAssetTrimSetup
{
    public static class InstallerCore
    {
        public const string ScriptName = "Unity Asset Trim.jsx";

        public static byte[] ReadPayload()
        {
            using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("UnityAssetTrim.jsx"))
            {
                if (stream == null) throw new InvalidOperationException("The embedded script is missing.");
                using (MemoryStream memory = new MemoryStream()) { stream.CopyTo(memory); return memory.ToArray(); }
            }
        }

        public static string ValidateRoot(string path)
        {
            if (String.IsNullOrWhiteSpace(path)) throw new ArgumentException("Select a Photoshop installation folder.");
            string root = Path.GetFullPath(Environment.ExpandEnvironmentVariables(path.Trim().Trim('"')));
            if (File.Exists(root) && String.Equals(Path.GetFileName(root), "Photoshop.exe", StringComparison.OrdinalIgnoreCase))
                root = Path.GetDirectoryName(root);
            root = root.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            if (!File.Exists(Path.Combine(root, "Photoshop.exe")))
                throw new ArgumentException("Photoshop.exe was not found in the selected folder.");
            return root;
        }

        public static string ScriptPath(string root)
        {
            return Path.Combine(ValidateRoot(root), "Presets", "Scripts", ScriptName);
        }

        public static bool IsOurScript(string file)
        {
            if (!File.Exists(file)) return false;
            string content = File.ReadAllText(file, Encoding.UTF8);
            return content.Contains("/* Unity Asset Trim v") && content.Contains("var UnityAssetTrim = (function () {")
                || content.Contains("$.evalFile(File(app.path.fsName + '/UnityAssetTrim/UnityAssetTrim.jsx'))");
        }

        public static string Install(string root)
        {
            string target = ScriptPath(root);
            string directory = Path.GetDirectoryName(target);
            Directory.CreateDirectory(directory);
            byte[] payload = ReadPayload();
            if (File.Exists(target) && SameBytes(File.ReadAllBytes(target), payload)) return target;
            string temporary = Path.Combine(directory, ".UnityAssetTrim-" + Guid.NewGuid().ToString("N") + ".tmp");
            try
            {
                using (FileStream stream = new FileStream(temporary, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                { stream.Write(payload, 0, payload.Length); stream.Flush(true); }
                if (File.Exists(target))
                {
                    string backup = target + ".backup-" + DateTime.UtcNow.ToString("yyyyMMddHHmmssfff", CultureInfo.InvariantCulture) + "-" + Guid.NewGuid().ToString("N").Substring(0, 6);
                    File.Replace(temporary, target, backup);
                }
                else File.Move(temporary, target);
                if (!SameBytes(File.ReadAllBytes(target), payload)) throw new IOException("Installed script verification failed.");
                return target;
            }
            finally { if (File.Exists(temporary)) File.Delete(temporary); }
        }

        public static bool Uninstall(string root)
        {
            string target = ScriptPath(root);
            if (!File.Exists(target)) return false;
            if (!IsOurScript(target)) throw new InvalidOperationException("This file does not belong to Unity Asset Trim. Nothing was removed.");
            File.Delete(target);
            return true;
        }

        private static bool SameBytes(byte[] a, byte[] b)
        {
            using (SHA256 hash = SHA256.Create())
                return Convert.ToBase64String(hash.ComputeHash(a)) == Convert.ToBase64String(hash.ComputeHash(b));
        }

        public static List<string> DetectInstallations()
        {
            SortedSet<string> found = new SortedSet<string>(StringComparer.OrdinalIgnoreCase);
            Action<string> add = delegate(string path) {
                try { if (!String.IsNullOrWhiteSpace(path)) found.Add(ValidateRoot(path)); } catch { }
            };
            foreach (RegistryHive hive in new[] { RegistryHive.LocalMachine, RegistryHive.CurrentUser })
            foreach (RegistryView view in new[] { RegistryView.Registry64, RegistryView.Registry32 })
            {
                try
                {
                    using (RegistryKey registry = RegistryKey.OpenBaseKey(hive, view))
                    {
                        using (RegistryKey apps = registry.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Photoshop.exe"))
                            if (apps != null) { add(apps.GetValue("") as string); add(apps.GetValue("Path") as string); }
                        using (RegistryKey photoshop = registry.OpenSubKey(@"SOFTWARE\Adobe\Photoshop"))
                            if (photoshop != null)
                                foreach (string version in photoshop.GetSubKeyNames())
                                    using (RegistryKey entry = photoshop.OpenSubKey(version))
                                        if (entry != null) add(entry.GetValue("ApplicationPath") as string);
                    }
                }
                catch (System.Security.SecurityException) { }
                catch (UnauthorizedAccessException) { }
                catch (IOException) { }
            }
            // Only inspect conventional installation parents, never whole drives.
            List<string> parents = new List<string>();
            parents.Add(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Adobe"));
            parents.Add(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Adobe"));
            try
            {
                foreach (DriveInfo drive in DriveInfo.GetDrives())
                    if (drive.DriveType == DriveType.Fixed && drive.IsReady)
                    {
                        parents.Add(Path.Combine(drive.RootDirectory.FullName, "Adobe"));
                        parents.Add(Path.Combine(drive.RootDirectory.FullName, "Program Files", "Adobe"));
                    }
            }
            catch (IOException) { }
            foreach (string parent in parents)
            {
                try { if (Directory.Exists(parent)) foreach (string dir in Directory.GetDirectories(parent, "*Photoshop*")) add(dir); }
                catch (IOException) { }
                catch (UnauthorizedAccessException) { }
            }
            return new List<string>(found);
        }
    }

    internal static class Program
    {
        [STAThread]
        private static int Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            bool chinese = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName == "zh";
            bool quiet = Array.IndexOf(args, "/quiet") >= 0;
            bool uninstall = args.Length > 0 && args[0] == "/uninstall";
            if (Array.IndexOf(args, "/en") >= 0) chinese = false;
            if (Array.IndexOf(args, "/zh") >= 0) chinese = true;
            if (args.Length > 0 && (args[0] == "/install" || uninstall))
            {
                try
                {
                    if (args.Length < 2) throw new ArgumentException("A Photoshop installation folder is required.");
                    if (uninstall) InstallerCore.Uninstall(args[1]); else InstallerCore.Install(args[1]);
                    if (!quiet) MessageBox.Show(chinese ? "操作完成。请重启 Photoshop。" : "Complete. Restart Photoshop.", "Unity Asset Trim");
                    return 0;
                }
                catch (Exception error)
                {
                    if (!quiet) MessageBox.Show(error.Message, "Unity Asset Trim", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return 1;
                }
            }
            if (args.Length > 0) return 2;
            Application.Run(new SetupForm(chinese));
            return 0;
        }
    }

    internal sealed class SetupForm : Form
    {
        private bool chinese;
        private readonly ComboBox language = new ComboBox();
        private readonly ComboBox folder = new ComboBox();
        private readonly Label subtitle = new Label(), folderLabel = new Label(), details = new Label(), status = new Label();
        private readonly Button browse = new Button(), install = new Button(), uninstall = new Button();

        public SetupForm(bool useChinese)
        {
            chinese = useChinese;
            Text = "Unity Asset Trim Setup v1.0.0";
            Font = new Font("Segoe UI", 10F);
            AutoScaleMode = AutoScaleMode.Dpi;
            ClientSize = new Size(660, 415);
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Color.FromArgb(248, 250, 252);
            Label title = new Label { Text = "Unity Asset Trim", Font = new Font("Segoe UI", 24F, FontStyle.Bold), AutoSize = true, Location = new Point(28, 24) };
            Controls.Add(title);
            language.DropDownStyle = ComboBoxStyle.DropDownList;
            language.Items.AddRange(new object[] { "简体中文", "English" });
            language.SetBounds(496, 35, 135, 30); language.SelectedIndex = chinese ? 0 : 1;
            language.SelectedIndexChanged += delegate { chinese = language.SelectedIndex == 0; Localize(); };
            subtitle.SetBounds(30, 82, 600, 42);
            folderLabel.SetBounds(30, 137, 595, 26);
            folder.SetBounds(30, 166, 493, 32); folder.DropDownStyle = ComboBoxStyle.DropDown;
            folder.Items.AddRange(InstallerCore.DetectInstallations().ToArray());
            if (folder.Items.Count > 0) folder.SelectedIndex = folder.Items.Count - 1;
            browse.SetBounds(535, 165, 96, 32);
            browse.Click += delegate {
                using (FolderBrowserDialog picker = new FolderBrowserDialog())
                {
                    picker.Description = chinese ? "选择包含 Photoshop.exe 的安装文件夹" : "Select the folder containing Photoshop.exe";
                    picker.ShowNewFolderButton = false;
                    if (Directory.Exists(folder.Text)) picker.SelectedPath = folder.Text;
                    if (picker.ShowDialog(this) == DialogResult.OK) folder.Text = picker.SelectedPath;
                }
            };
            details.SetBounds(30, 217, 600, 58);
            status.SetBounds(30, 284, 600, 48); status.ForeColor = Color.FromArgb(30, 64, 175);
            uninstall.SetBounds(30, 348, 142, 38); uninstall.Click += delegate { RunOperation(true); };
            install.SetBounds(443, 344, 188, 44); install.BackColor = Color.FromArgb(37, 99, 235); install.ForeColor = Color.White;
            install.FlatStyle = FlatStyle.Flat; install.Click += delegate { RunOperation(false); };
            Controls.AddRange(new Control[] { language, subtitle, folderLabel, folder, browse, details, status, uninstall, install });
            AcceptButton = install;
            Localize();
        }

        private void Localize()
        {
            subtitle.Text = chinese ? "Photoshop 批量裁剪透明边缘工具\n安装后从「文件 → 脚本」启动。" : "Batch-trim transparent image borders in Photoshop.\nLaunch from File > Scripts after installation.";
            folderLabel.Text = chinese ? "Photoshop 安装位置（自动检测，也可手动选择）" : "Photoshop installation (detected automatically, or browse)";
            browse.Text = chinese ? "浏览…" : "Browse...";
            details.Text = chinese ? "将脚本安装到 Presets\\Scripts。原有同名脚本会备份。\nMIT 许可证 · 无需下载组件 · 不修改 Photoshop 程序文件" : "Installs to Presets\\Scripts. Existing scripts with the same name are backed up.\nMIT License · Offline installation · Photoshop program files stay intact";
            install.Text = chinese ? "一键安装 / 更新" : "Install / Update";
            uninstall.Text = chinese ? "卸载脚本" : "Uninstall script";
            status.Text = folder.Items.Count == 0 ? (chinese ? "未检测到 Photoshop，请手动选择安装位置。" : "Photoshop was not detected. Select its installation folder.") : "";
        }

        private static bool IsAdministrator()
        {
            using (WindowsIdentity identity = WindowsIdentity.GetCurrent())
                return new WindowsPrincipal(identity).IsInRole(WindowsBuiltInRole.Administrator);
        }

        private void RunOperation(bool remove)
        {
            try
            {
                string root = InstallerCore.ValidateRoot(folder.Text);
                if (remove && MessageBox.Show(this, chinese ? "卸载此 Photoshop 中的 Unity Asset Trim 脚本？" : "Remove Unity Asset Trim from this Photoshop installation?", "Unity Asset Trim", MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return;
                install.Enabled = uninstall.Enabled = false;
                try
                {
                    if (remove) InstallerCore.Uninstall(root); else InstallerCore.Install(root);
                }
                catch (UnauthorizedAccessException)
                {
                    if (IsAdministrator()) throw;
                    status.Text = chinese ? "需要管理员权限，请在系统提示中允许。" : "Administrator access is required. Accept the Windows prompt.";
                    ProcessStartInfo start = new ProcessStartInfo(Application.ExecutablePath);
                    start.UseShellExecute = true; start.Verb = "runas";
                    // ValidateRoot removes trailing separators; Windows paths cannot contain quotes.
                    start.Arguments = (remove ? "/uninstall \"" : "/install \"") + root + "\" /quiet " + (chinese ? "/zh" : "/en");
                    using (Process child = Process.Start(start))
                    {
                        child.WaitForExit();
                        if (child.ExitCode != 0) throw new IOException(chinese ? "管理员操作未完成，请检查目录权限。" : "The elevated operation failed. Check folder permissions.");
                    }
                }
                status.Text = chinese ? "完成！请重启 Photoshop。" : "Done! Restart Photoshop.";
            }
            catch (Win32Exception error)
            {
                status.Text = error.NativeErrorCode == 1223 ? (chinese ? "已取消管理员权限请求。" : "Administrator request cancelled.") : error.Message;
            }
            catch (Exception error) { MessageBox.Show(this, error.Message, "Unity Asset Trim", MessageBoxButtons.OK, MessageBoxIcon.Error); }
            finally { install.Enabled = uninstall.Enabled = true; }
        }
    }
}
