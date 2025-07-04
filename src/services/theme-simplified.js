import { ref, watch } from "vue";

// 全局主题状态 - 确保所有组件使用同一个响应式状态，默认亮色主题
const globalThemeState = ref(localStorage.getItem("theme") === "dark" ? "dark" : "light");

// 使用DaisyUI兼容的深色模式
export const useDarkMode = (emitter = null) => {
  const darkMode = ref(
    localStorage.getItem("darkMode") === "true" ||
      window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // 切换深色模式
  const toggleDarkMode = () => {
    console.log("切换深色模式:", !darkMode.value, new Date().toISOString());
    darkMode.value = !darkMode.value;
    localStorage.setItem("darkMode", darkMode.value);

    // 直接使用DaisyUI主题切换
    const newTheme = darkMode.value ? "dark" : "light";
    setTheme(newTheme);

    // 通知主题变化
    if (emitter) {
      emitter.emit("dark-mode-changed", darkMode.value);
    }
  };

  return {
    darkMode,
    toggleDarkMode,
  };
};

// 简化的主题设置函数，完全兼容DaisyUI
export function setTheme(themeName) {
  if (!themeName || !["light", "dark"].includes(themeName)) {
    themeName = "light";
  }

  console.log("设置主题:", themeName);

  // 更新全局状态
  globalThemeState.value = themeName;

  // 设置DaisyUI主题属性
  document.documentElement.setAttribute("data-theme", themeName);
  document.body.setAttribute("data-theme", themeName);

  // 更新存储
  localStorage.setItem("theme", themeName); // 设置暗色模式类（为了兼容现有CSS）
  if (themeName === "dark") {
    document.documentElement.classList.add("dark-mode");
    document.body.classList.add("dark-mode");

    // 强制修复暗色模式下的文本颜色问题
    const forceWhiteText = () => {
      // 获取所有可见的文本元素
      const textElements = document.querySelectorAll(
        "p, span, div, h1, h2, h3, h4, h5, h6, label, td, th, li, a, button, input, textarea, select, .card-title, .card-body, .text-base-content"
      );

      textElements.forEach((el) => {
        // 跳过有特殊颜色类的元素
        if (
          !el.classList.contains("text-primary") &&
          !el.classList.contains("text-secondary") &&
          !el.classList.contains("text-accent") &&
          !el.classList.contains("text-success") &&
          !el.classList.contains("text-warning") &&
          !el.classList.contains("text-error") &&
          !el.classList.contains("text-info")
        ) {
          const computedStyle = window.getComputedStyle(el);
          const color = computedStyle.color;

          // 检查是否是黑色或深色文本
          if (
            color === "rgb(0, 0, 0)" ||
            color === "rgba(0, 0, 0, 1)" ||
            color === "#000000" ||
            color === "black" ||
            color.includes("rgb(0, 0, 0)") ||
            color.includes("rgba(0, 0, 0")
          ) {
            // 强制设置为白色文本
            el.style.setProperty(
              "color",
              "rgba(255, 255, 255, 0.87)",
              "important"
            );
          }
        }
      });

      // 处理所有可能的文本容器
      const containers = document.querySelectorAll(
        ".app-container, .content-area, .home-view, .main-content, .card, .card-body"
      );
      containers.forEach((container) => {
        container.style.setProperty(
          "color",
          "rgba(255, 255, 255, 0.87)",
          "important"
        );
      });
    };

    // 立即执行一次
    forceWhiteText();

    // 延迟执行，确保DOM完全渲染后再修复
    setTimeout(forceWhiteText, 50);
    setTimeout(forceWhiteText, 100);
    setTimeout(forceWhiteText, 200);
  } else {
    document.documentElement.classList.remove("dark-mode");
    document.body.classList.remove("dark-mode");

    // 移除强制的白色文本样式
    const elements = document.querySelectorAll(
      "[style*='color: rgba(255, 255, 255']"
    );
    elements.forEach((el) => {
      el.style.removeProperty("color");
    });
  }

  // 强制刷新样式
  document.documentElement.style.colorScheme =
    themeName === "dark" ? "dark" : "light";

  // 触发重绘
  setTimeout(() => {
    document.body.style.transform = "translateZ(0)";
    requestAnimationFrame(() => {
      document.body.style.transform = "";
    });
  }, 0);

  // 触发主题变更事件
  window.dispatchEvent(
    new CustomEvent("theme-changed", { detail: { theme: themeName } })
  );

  console.log("主题已设置:", themeName);
}

// 初始化主题
export function initTheme() {
  try {
    // 强制默认使用亮色主题，除非用户明确选择了暗色主题
    const savedTheme = localStorage.getItem("theme");
    let currentTheme = "light"; // 默认亮色主题
    
    // 只有当用户明确保存了暗色主题时才使用暗色
    if (savedTheme === "dark") {
      currentTheme = "dark";
    }

    // 更新全局状态
    globalThemeState.value = currentTheme;

    // 应用主题
    setTheme(currentTheme);

    console.log("主题初始化完成:", currentTheme, "(强制默认亮色主题)");
  } catch (err) {
    console.error("初始化主题时出错:", err);
    // 使用默认亮色主题
    globalThemeState.value = "light";
    setTheme("light");
  }
}

// 使用主题配置
export const useTheme = () => {
  // 返回全局主题状态，确保所有组件使用同一个响应式状态
  const currentTheme = globalThemeState;

  // DaisyUI的主题列表 - 只保留明暗色主题
  const availableThemes = ref([
    { name: "light", label: "明亮", color: "#FFFFFF" },
    { name: "dark", label: "深色", color: "#2a303c" },
  ]);

  // 设置主题
  const setThemeFunction = (themeName) => {
    if (!themeName) return;

    // 检查当前主题，如果没有变化则不重复操作
    const currentDomTheme = document.documentElement.getAttribute("data-theme");
    if (currentDomTheme === themeName) {
      console.log("主题未变化，跳过设置:", themeName);
      return;
    }

    console.log("主题变更:", currentTheme.value, "->", themeName);

    // 直接调用全局setTheme函数
    setTheme(themeName);
  };

  return {
    currentTheme,
    availableThemes,
    setTheme: setThemeFunction,
  };
};

// 主题色彩应用函数（简化版，不干扰DaisyUI）
export function applyThemeColor(color) {
  if (!color) return;

  // 只设置自定义CSS变量，不干扰DaisyUI
  try {
    localStorage.setItem("themeColor", color);
    document.documentElement.style.setProperty("--custom-theme-color", color);
    console.log("已设置自定义主题色:", color);
  } catch (error) {
    console.error("设置主题色时出错:", error);
  }
}

// 更新主题颜色（简化版）
export function updateThemeColors(primaryColor) {
  if (primaryColor) {
    applyThemeColor(primaryColor);
  }
}
