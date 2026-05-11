"""One-off footer compliance reshape; run from repo root then delete."""
import pathlib

root = pathlib.Path(__file__).resolve().parent

old_sub = """  <footer class="site-footer">
    <p>© 2026 1000元穷游北京 · 千元预算·玩转京城</p>
    <p>本站所有景点票价、开放时间、预约政策等信息仅供参考，出行前请以景区、交通部门官方实时公布为准。</p>
    <p><a href="../privacy.html">隐私政策</a> · ICP备XXXXXXXX号-X · 📧 mr.yanbo@qq.com</p>
  </footer>"""

new_sub_plain = """  <footer class="site-footer">
    <p>© 2026 1000元穷游北京 · 千元预算·玩转京城</p>
    <p><a href="../privacy.html">隐私政策</a></p>
    <p>ICP备XXXXXXXX号-X</p>
    <p>📧 mr.yanbo@qq.com</p>
  </footer>"""

new_sub_save = """  <footer class="site-footer">
    <p>© 2026 1000元穷游北京 · 千元预算·玩转京城</p>
    <p>本站所有景点票价、开放时间、预约政策等信息仅供参考，出行前请以景区、交通部门官方实时公布为准。</p>
    <p><a href="../privacy.html">隐私政策</a></p>
    <p>ICP备XXXXXXXX号-X</p>
    <p>📧 mr.yanbo@qq.com</p>
  </footer>"""

for p in sorted(root.glob("pages/*.html")):
    t = p.read_text(encoding="utf-8")
    if old_sub not in t:
        raise SystemExit(f"Unexpected footer in {p}")
    repl = new_sub_save if p.name == "save-money.html" else new_sub_plain
    p.write_text(t.replace(old_sub, repl), encoding="utf-8")

for p in sorted(root.glob("articles/*.html")):
    t = p.read_text(encoding="utf-8")
    if old_sub not in t:
        raise SystemExit(f"Unexpected footer in {p}")
    p.write_text(t.replace(old_sub, new_sub_plain), encoding="utf-8")

print("pages + articles OK")
