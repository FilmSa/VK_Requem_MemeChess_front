function memoizeLoader(loader) {
  let promise = null;

  return () => {
    if (!promise) {
      promise = loader();
    }

    return promise;
  };
}

export const preloadHomePage = memoizeLoader(() => import("../pages/HomePage.jsx"));
export const preloadInvitePage = memoizeLoader(() =>
  import("../pages/InvitePage.jsx")
);
export const preloadLoginPage = memoizeLoader(() =>
  import("../pages/LoginPage.jsx")
);
export const preloadPlayPage = memoizeLoader(() => import("../pages/PlayPage.jsx"));
export const preloadProfilePage = memoizeLoader(() =>
  import("../pages/ProfilePage.jsx")
);
export const preloadRegisterPage = memoizeLoader(() =>
  import("../pages/RegisterPage.jsx")
);
export const preloadShopPage = memoizeLoader(() => import("../pages/ShopPage.jsx"));
export const preloadTournamentsPage = memoizeLoader(() =>
  import("../pages/TournamentsPage.jsx")
);

export function resolveRoutePreloader(pathname = "/") {
  if (pathname === "/" || pathname === "") {
    return preloadHomePage;
  }

  if (pathname === "/play" || pathname.startsWith("/play")) {
    return preloadPlayPage;
  }

  if (pathname === "/shop") {
    return preloadShopPage;
  }

  if (pathname === "/profile") {
    return preloadProfilePage;
  }

  if (pathname === "/login") {
    return preloadLoginPage;
  }

  if (pathname === "/register") {
    return preloadRegisterPage;
  }

  if (pathname.startsWith("/invite/")) {
    return preloadInvitePage;
  }

  if (pathname === "/tournaments") {
    return preloadTournamentsPage;
  }

  return null;
}
