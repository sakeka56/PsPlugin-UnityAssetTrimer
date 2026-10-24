using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public static class DialogDriver
{
    private delegate bool Callback(IntPtr window, IntPtr data);
    [DllImport("user32.dll")] private static extern bool EnumWindows(Callback callback, IntPtr data);
    [DllImport("user32.dll")] private static extern bool IsWindowVisible(IntPtr window);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern int GetWindowText(IntPtr window, StringBuilder text, int length);
    [DllImport("user32.dll")] private static extern bool PostMessage(IntPtr window, uint message, IntPtr parameter, IntPtr data);
    private static string Title(IntPtr window) { StringBuilder text = new StringBuilder(1024); GetWindowText(window, text, text.Capacity); return text.ToString(); }
    public static int Main(string[] args)
    {
        string expectedTitle = args.Length > 0 ? args[0] : "UAT regression 1.0.1 window-close";
        HashSet<string> handled = new HashSet<string>();
        Stopwatch timer = Stopwatch.StartNew();
        while (handled.Count < 1 && timer.Elapsed.TotalSeconds < 20)
        {
            EnumWindows(delegate(IntPtr window, IntPtr data) {
                string title = Title(window);
                if (!IsWindowVisible(window) || title != expectedTitle || handled.Contains(title)) return true;
                PostMessage(window, 0x0010, IntPtr.Zero, IntPtr.Zero);
                handled.Add(title);
                return true;
            }, IntPtr.Zero);
            Thread.Sleep(100);
        }
        return handled.Count == 1 ? 0 : 1;
    }
}
