// function initMobileNav() {
//   const navigation = document.querySelector("header .nav");
//   navigation.querySelector(".nav-toggler").addEventListener("click", () => {
//     toggleItem(navigation, ".nav-toggler", ".nav-list", "show");
//   });
// }

//Header Scroll Handling
let prevScroll = 0;
const header = document.querySelector("header");

function handleHeaderScroll() {
  const currentScroll = window.scrollY;
  if (currentScroll <= 0) {
    header.classList.remove("hidden");
  } else if (currentScroll > prevScroll) {
    header.classList.add("hidden");
  } else {
    header.classList.remove("hidden");
  }
  prevScroll = currentScroll;
}

function initHeaderScroll() {
  window.addEventListener("scroll", handleHeaderScroll);
}

function init() {
  initHeaderScroll();
  // initMobileNav();
}

window.addEventListener("DOMContentLoaded", init);
