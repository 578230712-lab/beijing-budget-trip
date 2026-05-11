/**
 * 1000元穷游北京 — 公共脚本
 * 1. 汉堡菜单展开/收起
 * 2. 导航锚点平滑滚动
 * 3. 折叠面板 .active 切换
 * 4. 攻略下拉菜单
 * 5. 预算计算器（#calc-btn）
 * 6. 目的地页：关键词搜索 + 多标签 AND 筛选（[data-dest-search]、[data-dest-filter-bar]）
 */
(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");

  function setMenuOpen(open) {
    if (!header) return;
    header.classList.toggle("is-open", open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    }
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function closeAllDropdowns() {
    document.querySelectorAll(".nav-item--dropdown.is-open").forEach(function (wrap) {
      wrap.classList.remove("is-open");
      var t = wrap.querySelector(".nav-dropdown__toggle");
      if (t) t.setAttribute("aria-expanded", "false");
    });
  }

  if (toggle && header) {
    toggle.addEventListener("click", function () {
      setMenuOpen(!header.classList.contains("is-open"));
    });
  }

  document.querySelectorAll(".nav-dropdown__toggle").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var li = btn.closest(".nav-item--dropdown");
      if (!li) return;
      var willOpen = !li.classList.contains("is-open");
      closeAllDropdowns();
      if (willOpen) {
        li.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  function scrollToId(id) {
    if (!id) return;
    var el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;

    var href = link.getAttribute("href");
    if (!href || href === "#") return;

    var id = href.slice(1);
    if (!id) return;

    e.preventDefault();
    scrollToId(id);
    closeMenu();
    closeAllDropdowns();
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".nav-item--dropdown")) {
      closeAllDropdowns();
    }

    if (window.innerWidth >= 768) return;
    if (!nav || !toggle || !header) return;
    if (nav.contains(e.target) || toggle.contains(e.target)) return;
    if (header.classList.contains("is-open")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeAllDropdowns();
      closeMenu();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 768) {
      closeMenu();
      closeAllDropdowns();
    }
  });

  /* 折叠面板 */
  document.querySelectorAll(".accordion").forEach(function (root) {
    root.querySelectorAll(".accordion-trigger").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".accordion-item");
        if (!item) return;
        var open = item.classList.toggle("active");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  });

  /* 预算计算器 */
  var calcBtn = document.getElementById("calc-btn");
  var calcResult = document.getElementById("calc-result");
  if (calcBtn && calcResult) {
    var calcSection = calcBtn.closest("[data-budget-cap]");
    var budgetCap = 1000;
    if (calcSection) {
      var cap = parseInt(calcSection.getAttribute("data-budget-cap"), 10);
      if (!isNaN(cap) && cap > 0) budgetCap = cap;
    }

    var calcInputIds = [
      "calc-travel",
      "calc-lodging",
      "calc-meals",
      "calc-tickets",
      "calc-buffer",
    ];

    if (!document.getElementById("calc-travel")) {
      calcInputIds[0] = "calc-transport";
    }

    calcBtn.addEventListener("click", function () {
      var sum = 0;
      calcInputIds.forEach(function (id) {
        var el = document.getElementById(id);
        var v = el ? parseFloat(el.value, 10) : NaN;
        sum += isNaN(v) ? 0 : v;
      });
      var total = Math.round(sum);
      var ok = total <= budgetCap;
      var remaining = Math.max(0, budgetCap - total);

      if (ok) {
        calcResult.innerHTML =
          '<div class="calc-result-panel calc-result-panel--ok">' +
          '<p class="calc-result-panel__title">✅ 恭喜！你的预算完全过关！</p>' +
          '<p class="calc-result-panel__line">总花费：¥' +
          total +
          "，剩余 ¥" +
          remaining +
          "</p>" +
          '<p class="calc-result-panel__hint">可以放心出发啦，记得带上学生证哦～</p>' +
          "</div>";
      } else {
        var over = total - budgetCap;
        calcResult.innerHTML =
          '<div class="calc-result-panel calc-result-panel--over">' +
          '<p class="calc-result-panel__title">⚠️ 预算超了 ¥' +
          over +
          "</p>" +
          '<p class="calc-result-panel__line">建议：减少备用金、自带干粮、或选择更便宜的住宿</p>' +
          '<p class="calc-result-panel__hint">试试把住宿换成青旅，能省不少！</p>' +
          "</div>";
      }
    });
  }

  /* 目的地页：实时搜索 + 多选标签（同时满足 AND） */
  var destFilterBar = document.querySelector("[data-dest-filter-bar]");
  var destSearchInput = document.querySelector("[data-dest-search]");
  var destEmpty = document.querySelector("[data-dest-empty]");
  if (destFilterBar) {
    var destFilterBtns = destFilterBar.querySelectorAll("button[data-dest-filter]");
    var destCards = document.querySelectorAll("[data-dest-card]");
    var destSelectedTags = new Set();

    function destCardMatchesSearch(card, queryLower) {
      if (!queryLower) return true;
      var blob =
        (card.getAttribute("data-search") || "") +
        " " +
        (card.textContent || "").replace(/\s+/g, " ");
      return blob.toLowerCase().indexOf(queryLower) !== -1;
    }

    function destUpdateFilterButtons() {
      destFilterBtns.forEach(function (b) {
        var key = b.getAttribute("data-dest-filter") || "all";
        if (key === "all") {
          var allOn = destSelectedTags.size === 0;
          b.classList.toggle("is-active", allOn);
          b.setAttribute("aria-pressed", allOn ? "true" : "false");
        } else {
          var on = destSelectedTags.has(key);
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        }
      });
    }

    function applyDestFilters() {
      var q = destSearchInput ? (destSearchInput.value || "").trim().toLowerCase() : "";
      var filters = Array.from(destSelectedTags);
      var visible = 0;

      destCards.forEach(function (card) {
        var raw = card.getAttribute("data-tags") || "";
        var tags = raw.split(/\s+/).filter(function (t) {
          return t.length > 0;
        });
        var tagOk =
          filters.length === 0 ||
          filters.every(function (f) {
            return tags.indexOf(f) !== -1;
          });
        var searchOk = destCardMatchesSearch(card, q);
        var show = tagOk && searchOk;
        card.hidden = !show;
        if (show) visible++;
      });

      if (destEmpty) {
        destEmpty.hidden = visible > 0;
      }
    }

    destFilterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-dest-filter") || "all";
        if (key === "all") {
          destSelectedTags.clear();
        } else {
          if (destSelectedTags.has(key)) {
            destSelectedTags.delete(key);
          } else {
            destSelectedTags.add(key);
          }
        }
        destUpdateFilterButtons();
        applyDestFilters();
      });
    });

    if (destSearchInput) {
      destSearchInput.addEventListener("input", applyDestFilters);
    }

    destUpdateFilterButtons();
    applyDestFilters();
  }
})();
