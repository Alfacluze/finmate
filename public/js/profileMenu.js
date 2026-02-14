// profileMenu
(function () {
  const btn = document.getElementById("profileBtn");
  const menu = document.getElementById("profileMenu");

  if (!btn || !menu) return; // page doesn't have navbar block

  const signedOutView = document.getElementById("pmSignedOut");
  const signedInView = document.getElementById("pmSignedIn");

  const pmHello = document.getElementById("pmHello");
  const pmMeta = document.getElementById("pmMeta");

  const btnSignIn = document.getElementById("btnSignIn");
  const btnCreate = document.getElementById("btnCreate");
  const btnLogout = document.getElementById("pmLogout");

  const USER_KEY = "finmate_user";


  function getETString() {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    }).format(new Date());
  }
function notifyUserChanged() {
  window.dispatchEvent(new Event("finmate:userChanged"));
}

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  }

  function setUser(userObj) {
    localStorage.setItem(USER_KEY, JSON.stringify(userObj));
  }

  function clearUser() {
    localStorage.removeItem(USER_KEY);
  }

  function renderMenu() {
    const user = getUser();

    if (!user) {
      signedOutView.style.display = "block";
      signedInView.style.display = "none";
      return;
    }

    signedOutView.style.display = "none";
    signedInView.style.display = "block";

    if (pmHello) pmHello.textContent = `Welcome back 👋, ${user.username}`;
    if (pmMeta) pmMeta.textContent = `Last login: ${user.lastLoginET}`;
  }

  function openMenu() {
    menu.classList.add("open");
    menu.setAttribute("aria-hidden", "false");
    btn.setAttribute("aria-expanded", "true");
    renderMenu();
  }

  function closeMenu() {
    menu.classList.remove("open");
    menu.setAttribute("aria-hidden", "true");
    btn.setAttribute("aria-expanded", "false");
  }

  function toggleMenu() {
    if (menu.classList.contains("open")) closeMenu();
    else openMenu();
  }

  // Click avatar to toggle
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Click outside closes
  document.addEventListener("click", () => closeMenu());

  // Prevent clicks inside from closing
  menu.addEventListener("click", (e) => e.stopPropagation());

  // Fake sign in / create account (for now)
  function fakeSignIn(mode) {
    const username =
      prompt(mode === "create" ? "Create a username:" : "Enter username:") || "";
    const clean = username.trim();
    if (!clean) return;

    setUser({
      username: clean,
      lastLoginET: getETString(),
    });

    renderMenu();
    notifyUserChanged();
    emitUserChanged(); // ✅ tell pages to refresh greeting
  }

  if (btnSignIn) btnSignIn.addEventListener("click", () => fakeSignIn("signin"));
  if (btnCreate) btnCreate.addEventListener("click", () => fakeSignIn("create"));

  if (btnLogout)
    btnLogout.addEventListener("click", () => {
      clearUser();
      renderMenu();
      closeMenu();
      notifyUserChanged();

    });

  // Initial render
  renderMenu();
})();
