using System;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Text;
using System.Windows.Forms;

public static class LayoutTests
{
    private static readonly StringBuilder Results = new StringBuilder();
    [STAThread]
    public static int Main(string[] args)
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        try
        {
            Type type = Assembly.LoadFrom(args[0]).GetType("UnityAssetTrimSetup.SetupForm", true);
            foreach (bool chinese in new[] { false, true })
            foreach (float scale in new[] { 1F, 1.5F, 2F })
            using (Form form = (Form)Activator.CreateInstance(type, new object[] { chinese }))
            {
                if (form.FormBorderStyle != FormBorderStyle.Sizable || !form.MaximizeBox) throw new Exception("Window must be resizable.");
                form.Opacity = 0; form.Show(); Application.DoEvents();
                if (scale != 1F) { form.Scale(new SizeF(scale, scale)); form.Font = new Font("Segoe UI", 10F * scale); }
                foreach (int width in new[] { 640, 740, 1100 })
                {
                    form.Size = new Size((int)(width * scale), (int)(480 * scale));
                    form.PerformLayout(); Application.DoEvents();
                    CheckControls(form);
                }
                using (Bitmap image = new Bitmap(form.Width, form.Height))
                {
                    form.DrawToBitmap(image, new Rectangle(Point.Empty, form.Size));
                    image.Save(Path.Combine(args[1], "layout-" + (chinese ? "zh" : "en") + "-" + scale.ToString(System.Globalization.CultureInfo.InvariantCulture) + ".png"));
                }
                Results.AppendLine("PASS layout " + (chinese ? "zh" : "en") + " simulated scale " + scale);
            }
            return 0;
        }
        catch (Exception error) { Results.AppendLine("FAIL " + error); return 1; }
        finally { File.WriteAllText(Path.Combine(args[1], "layout-results.txt"), Results.ToString()); }
    }
    private static void CheckControls(Control parent)
    {
        foreach (Control control in parent.Controls)
        {
            ComboBox combo = control as ComboBox;
            if (combo != null && combo.DropDownStyle == ComboBoxStyle.DropDownList && String.IsNullOrWhiteSpace(combo.Text))
                throw new Exception("Language selector text is empty.");
            Label label = control as Label;
            if (label != null && label.Text.Length > 0)
            {
                Size preferred = label.GetPreferredSize(new Size(label.Width, 0));
                if (label.Height < preferred.Height) throw new Exception("Clipped label: " + label.Text);
            }
            Button button = control as Button;
            if (button != null && button.Width < TextRenderer.MeasureText(button.Text, button.Font).Width + button.Padding.Horizontal)
                throw new Exception("Clipped button: " + button.Text);
            CheckControls(control);
        }
    }
}
