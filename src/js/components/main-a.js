"use strict";
import Swiper from "swiper/bundle";
import Inputmask from "../../../node_modules/inputmask/dist/inputmask.es6.js";
import selectize from "@selectize/selectize";
(() => {
  const ACTIVE_CLASS = "_is-active";

  const fmtSize = bytes => {
    if (!Number.isFinite(bytes)) return "";
    const units = ["Б", "КБ", "МБ", "ГБ"];
    let i = 0,
      v = bytes;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    const num = i === 0 ? String(Math.round(v)) : v.toFixed(v < 10 ? 1 : 0);
    return `${num} ${units[i]}`;
  };

  const init = wrap => {
    const input = wrap.querySelector('input[type="file"]');
    const nameEl = wrap.querySelector("[data-file-inp-name]");
    const sizeEl = wrap.querySelector("[data-file-inp-size]");
    const resetBtn = wrap.querySelector(".inp-field__cross-btn");
    const txtEl = wrap.querySelector(".file-inp__txt");

    if (!input) return;

    const setState = () => {
      const file = input.files && input.files[0] ? input.files[0] : null;

      if (file) {
        wrap.classList.add(ACTIVE_CLASS);
        if (nameEl) nameEl.textContent = file.name;
        if (sizeEl) sizeEl.textContent = fmtSize(file.size);
        if (txtEl) txtEl.textContent = "Файл прикреплён";
      } else {
        wrap.classList.remove(ACTIVE_CLASS);
        if (nameEl) nameEl.textContent = "";
        if (sizeEl) sizeEl.textContent = "";
        if (txtEl) txtEl.textContent = "Прикрепить файл";
      }
    };

    input.addEventListener("change", setState);

    if (resetBtn) {
      resetBtn.addEventListener("click", e => {
        e.preventDefault();
        input.value = "";
        input.dispatchEvent(new Event("change", { bubbles: true }));
        setState();
      });
    }

    setState();
  };

  document.querySelectorAll("[data-file-inp]").forEach(init);

  const mo = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.matches?.("[data-file-inp]")) init(node);
        node.querySelectorAll?.("[data-file-inp]").forEach(init);
      });
    });
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();

(() => {
  const ACTIVE = "_is-active";
  const isTel = inp => inp?.matches?.("[data-tel-mask]");

  const hasUserInput = input => {
    const val = (input.value ?? "").trim();
    if (!val) return false;
    if (isTel(input)) return /\d/.test(val);
    return val.length > 0;
  };

  const setCrossState = wrap => {
    const input = wrap.querySelector("input, textarea");
    const btn = wrap.querySelector(".inp-field__cross-btn");
    if (!input || !btn) return;

    btn.classList.toggle(ACTIVE, hasUserInput(input));
  };

  const clearMasked = input => {
    if (window.Inputmask) {
      try {
        window.Inputmask.remove(input);
      } catch (e) {}
    }
    input.value = "";
    if (window.Inputmask && isTel(input)) {
      window
        .Inputmask({
          mask: "+7 (999) 999-99-99",
          showMaskOnHover: false,
          showMaskOnFocus: true,
          jitMasking: false,
          clearIncomplete: false,
          placeholder: "_",
        })
        .mask(input);
    }
  };

  const initField = wrap => {
    const input = wrap.querySelector("input, textarea");
    const btn = wrap.querySelector(".inp-field__cross-btn");
    if (!input || !btn) return;

    setCrossState(wrap);

    input.addEventListener("input", () => setCrossState(wrap));
    input.addEventListener("change", () => setCrossState(wrap));
    input.addEventListener("blur", () => setCrossState(wrap));

    btn.addEventListener("click", () => {
      if (input.inputmask) {
        if (typeof input.inputmask.setValue === "function")
          input.inputmask.setValue("");
        else clearMasked(input);
      } else {
        input.value = "";
      }

      input.dispatchEvent(new Event("input", { bubbles: true }));
      setCrossState(wrap);
      input.focus();
    });
  };

  document.querySelectorAll(".inp-field").forEach(initField);

  const mo = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.matches?.(".inp-field")) initField(node);
        node.querySelectorAll?.(".inp-field").forEach(initField);
      });
    });
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();

(() => {
  const ERROR_CLASS = "_is-error";
  const EMAIL_RE =
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@([a-z0-9-]+\.)+[a-z]{2,24}$/i;

  const getInput = e =>
    e.target.closest(
      ".inp-field[data-form-field] input, .inp-field[data-form-field] textarea, .inp-field[data-form-field] select",
    );

  const getWrap = input => input?.closest(".inp-field[data-form-field]");
  const getForm = el => el?.closest("form[data-form-validate]");

  const isTel = inp => inp?.matches?.("[data-tel-mask]");
  const isEmail = inp => inp?.matches?.("[data-email-mask]");

  const isTelComplete = inp =>
    !!(
      inp &&
      inp.inputmask &&
      typeof inp.inputmask.isComplete === "function" &&
      inp.inputmask.isComplete()
    );

  const ensureOrigMsg = (wrap, input) => {
    if (!wrap) return;
    if (!wrap.hasAttribute("data-error-message-orig")) {
      const cur =
        wrap.getAttribute("data-error-message") ||
        input?.getAttribute("data-error-message") ||
        "";
      wrap.setAttribute("data-error-message-orig", cur);
    }
  };

  const setEmailMsg = (wrap, input, on) => {
    if (!wrap) return;
    ensureOrigMsg(wrap, input);
    if (on) wrap.setAttribute("data-error-message", "Введите корректный email");
    else {
      const orig = wrap.getAttribute("data-error-message-orig") || "";
      if (orig) wrap.setAttribute("data-error-message", orig);
      else wrap.removeAttribute("data-error-message");
    }
  };

  const isFilledRequired = inp => {
    if (!inp) return false;

    if (inp.type === "checkbox" || inp.type === "radio") return !!inp.checked;

    const val = (inp.value ?? "").trim();
    if (!val) return false;

    if (isTel(inp)) return isTelComplete(inp);

    if (isEmail(inp)) return EMAIL_RE.test(val);

    return true;
  };

  const setError = (wrap, msg) => {
    wrap.classList.add(ERROR_CLASS);

    let err = wrap.querySelector(".inp-field__error");
    if (!err) {
      err = document.createElement("div");
      err.className = "inp-field__error";
      wrap.appendChild(err);
    }
    err.textContent = msg || "Поле обязательно";
  };

  const clearError = wrap => {
    wrap.classList.remove(ERROR_CLASS);
    const err = wrap.querySelector(".inp-field__error");
    if (err) err.remove();
  };

  const validateInput = input => {
    if (!input || !input.required) return true;

    const wrap = getWrap(input);
    const val = (input.value ?? "").trim();

    if (isEmail(input) && wrap) {
      ensureOrigMsg(wrap, input);
      if (val && !EMAIL_RE.test(val)) setEmailMsg(wrap, input, true);
      else setEmailMsg(wrap, input, false);
    }

    const ok = isFilledRequired(input);

    if (!ok && wrap) {
      const msg =
        wrap.getAttribute("data-error-message") ||
        input.getAttribute("data-error-message") ||
        "Поле обязательно";
      setError(wrap, msg);
      return false;
    }

    if (ok && wrap) clearError(wrap);

    return ok;
  };

  const getRequiredControls = form =>
    form.querySelectorAll(
      "input[required], textarea[required], select[required]",
    );

  const updateSubmitState = form => {
    if (!form) return;

    const btn = form.querySelector("[data-form-btn]");
    if (!btn) return;

    const requiredInputs = getRequiredControls(form);

    Array.from(requiredInputs).forEach(inp => {
      if (!isEmail(inp)) return;
      const wrap = getWrap(inp);
      if (!wrap) return;
      const val = (inp.value ?? "").trim();
      ensureOrigMsg(wrap, inp);
      if (val && !EMAIL_RE.test(val)) setEmailMsg(wrap, inp, true);
      else setEmailMsg(wrap, inp, false);
    });

    const requiredChecks = Array.from(requiredInputs).filter(
      inp => inp.type === "checkbox" || inp.type === "radio",
    );

    const checksOk = requiredChecks.every(isFilledRequired);

    if (checksOk) btn.removeAttribute("disabled");
    else btn.setAttribute("disabled", "disabled");
  };

  const activateMessageForForm = form => {
    const key = form?.getAttribute("data-form-validate");
    if (!key) return false;

    const msgEl = document.querySelector(
      `[data-form-message="${CSS.escape(key)}"]`,
    );
    if (!msgEl) return false;

    msgEl.classList.add("_is-active");
    return true;
  };

  document.querySelectorAll("form[data-form-validate]").forEach(form => {
    form.setAttribute("novalidate", "novalidate");
    updateSubmitState(form);
  });

  document.addEventListener(
    "click",
    e => {
      const btn = e.target.closest("form[data-form-validate] [data-form-btn]");
      if (!btn) return;

      const form = btn.closest("form[data-form-validate]");
      if (!form) return;

      if (btn.hasAttribute("disabled")) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    },
    true,
  );

  document.addEventListener(
    "focusout",
    e => {
      const input = getInput(e);
      if (!input) return;

      const form = getForm(input);
      if (!form) return;

      validateInput(input);
      updateSubmitState(form);
    },
    true,
  );

  document.addEventListener(
    "input",
    e => {
      const input = getInput(e);
      if (!input) return;

      const form = getForm(input);
      if (!form) return;

      const wrap = getWrap(input);
      if (!wrap) return;

      if (!isEmail(input) && isFilledRequired(input)) clearError(wrap);
      updateSubmitState(form);
    },
    true,
  );

  document.addEventListener(
    "change",
    e => {
      const form = e.target.closest("form[data-form-validate]");
      if (!form) return;

      updateSubmitState(form);
    },
    true,
  );

  document.addEventListener(
    "keydown",
    e => {
      if (e.key !== "Enter") return;

      const form = e.target.closest("form[data-form-validate]");
      if (!form) return;

      const btn = form.querySelector("[data-form-btn]");
      if (btn && btn.hasAttribute("disabled")) e.preventDefault();
    },
    true,
  );

  document.addEventListener(
    "submit",
    e => {
      const form = e.target.closest("form[data-form-validate]");
      if (!form) return;

      e.preventDefault();

      const btn = form.querySelector("[data-form-btn]");
      if (btn && btn.hasAttribute("disabled")) {
        const requiredInputs = getRequiredControls(form);
        requiredInputs.forEach(inp => validateInput(inp));
        updateSubmitState(form);
        return;
      }

      const requiredInputs = getRequiredControls(form);

      let ok = true;

      requiredInputs.forEach(inp => {
        const res = validateInput(inp);
        if (!res) ok = false;
      });

      updateSubmitState(form);

      if (!ok) return;

      if (activateMessageForForm(form)) return;

      const formSel = form.getAttribute("data-popup-on-submit");
      if (formSel) {
        document.dispatchEvent(
          new CustomEvent("popup:open", { detail: { selector: formSel } }),
        );
        return;
      }

      const popup = form.closest("[data-popup]._is-active");
      if (!popup) return;

      const nextSelector = popup.getAttribute("data-popup-on-submit");
      if (!nextSelector) return;

      document.dispatchEvent(
        new CustomEvent("popup:open", { detail: { selector: nextSelector } }),
      );
    },
    true,
  );
})();

(() => {
  const ACTIVE_CLASS = "_is-active";
  const ROOT_OPEN_CLASS = "_is-popup-open";

  const closeAll = () => {
    document
      .querySelectorAll("[data-popup]." + ACTIVE_CLASS)
      .forEach(p => p.classList.remove(ACTIVE_CLASS));
    document.documentElement.classList.remove(ROOT_OPEN_CLASS);
  };

  const openPopup = selector => {
    const popup =
      document.querySelector(selector) ||
      document.querySelector(`[data-popup="${selector}"]`);
    if (!popup) return;

    closeAll();
    popup.classList.add(ACTIVE_CLASS);
    document.documentElement.classList.add(ROOT_OPEN_CLASS);
  };

  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-popup-btn]");
    if (btn) {
      e.preventDefault();
      openPopup(btn.getAttribute("data-popup-btn"));
      return;
    }

    const closeBtn = e.target.closest("[data-popup-close]");
    if (closeBtn) {
      e.preventDefault();
      closeAll();
      return;
    }

    const popup = e.target.closest("[data-popup]." + ACTIVE_CLASS);
    if (!popup) return;

    const body = e.target.closest("[data-popup-body]");
    if (!body) closeAll();
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeAll();
  });

  document.addEventListener("popup:open", e => {
    openPopup(e.detail?.selector);
  });

  document.addEventListener("popup:close", () => {
    closeAll();
  });

  window.popup = {
    open: selector =>
      document.dispatchEvent(
        new CustomEvent("popup:open", { detail: { selector } }),
      ),
    close: () => document.dispatchEvent(new CustomEvent("popup:close")),
  };
})();

if (document.querySelectorAll("[data-tel-mask]").length) {
  document.querySelectorAll("[data-tel-mask]").forEach(tel => {
    Inputmask({
      mask: "+7 (999) 999-99-99",
      showMaskOnHover: false,
      showMaskOnFocus: true,
      jitMasking: false,
      clearIncomplete: false,
      placeholder: "_",
    }).mask(tel);
  });
}

if (document.querySelectorAll("[data-email-mask]").length) {
  document.querySelectorAll("[data-email-mask]").forEach(input => {
    Inputmask({
      showMaskOnHover: false,
      jitMasking: true,
      clearMaskOnLostFocus: false,
      clearIncomplete: false,
      alias: "email",
    }).mask(input);
  });
}

var $ = require("jquery");
const rem = function (rem) {
  if (window.innerWidth > 768) {
    return 0.005208335 * window.innerWidth * rem;
  } else {
    // где 375 это ширина мобильной версии макета
    return (100 / 375) * (0.05 * window.innerWidth) * rem;
  }
};

$(`.delivery__tab-content[data-tab="1"]`).show();
$(".delivery__tab").on("click", function () {
  const tabIndex = $(this).attr("data-tab");
  if (!$(this).hasClass("active")) {
    $(".delivery__tab").removeClass("active");
    $(this).addClass("active");
    $(".delivery__tab-content").animate(
      {
        opacity: 0,
      },
      100,
      function () {
        $(this).hide();
        $(`.delivery__tab-content[data-tab="${tabIndex}"]`).show();
      },
    );
    $(`.delivery__tab-content[data-tab="${tabIndex}"]`).animate(
      {
        opacity: 1,
      },
      100,
    );
  }
});

let scrollY = 0;

function openModal() {
  scrollY = window.scrollY;
  const body = document.body;
  body.style.height = "100vh";
  body.style.overflowY = "hidden";
  if (window.innerWidth > 768) {
    body.style.paddingRight = "15px";
  }
}

function closeModal() {
  const body = document.body;
  body.style.position = "";
  body.style.top = "";
  body.style.height = "";
  body.style.overflowY = "";
  body.style.paddingRight = "";
  window.history.replaceState(
    null,
    null,
    window.location.pathname + window.location.search,
  );
  window.scrollTo(0, scrollY);
}

$(".products__slider_zoom").on("click", function () {
  const img = $(this).parent().find("img").first().attr("src");
  $(".modal__image img").attr("src", img);

  $(".modal__products").addClass("active");
  openModal();
});

$(".modal__close").on("click", function () {
  if ($(this).closest(".modal").hasClass("active")) {
    $(this).closest(".modal").removeClass("active");
    closeModal();
  }
});

document.addEventListener("click", el => {
  if ($(".modal.modal__products").hasClass("active")) {
    const md = document.querySelector(".modal.modal__products");
    const wrap = document.querySelector(".modal__wrapper");
    const notWrap = el.composedPath().includes(wrap);
    const window = el.composedPath().includes(md);
    if (window && !notWrap) {
      $(".modal.modal__products").removeClass("active");
      closeModal();
    }
  }
});

// const form = () => {
//   const form = document.querySelector(".hero__form");
//   const name = document.querySelector(".form__input--name");
//   const phone = document.querySelector(".form__input--tel");
//   const nameError = document.querySelector(".form__input--name + div.error");
//   const phoneError = document.querySelector(".form__input--tel + div.error");

//   if (name) {
//     name.addEventListener("input", function (event) {
//       if (name.validity.valid) {
//         nameError.className = "error";
//         name.classList.remove("invalid");
//       } else {
//         if (name.validity.valueMissing) {
//           nameError.className = "error active";
//           name.classList.add("invalid");
//         }
//         nameError.className = "error active";
//         name.classList.add("invalid");
//       }
//     });
//   }

//   if (phone) {
//     phone.addEventListener("input", function (event) {
//       if (phone.validity.valid) {
//         phoneError.className = "error";
//         phone.classList.remove("invalid");
//       } else {
//         if (phone.validity.valueMissing) {
//           phoneError.className = "error active";
//           phone.classList.add("invalid");
//         }
//         phoneError.className = "error active";
//         phone.classList.add("invalid");
//       }
//     });
//   }

//   if (form) {
//     form.addEventListener("submit", e => {
//       e.preventDefault();

//       console.log(phone.value.length);

//       if (
//         (name.value == "" && phone.value == "") ||
//         phone.value == "" ||
//         name.value == "" ||
//         phone.value.length < 16
//       ) {
//         if (name.value == "") {
//           name.classList.add("invalid");
//           nameError.className = "error active";
//         }
//         if (phone.value == "" || phone.value.length < 16) {
//           phone.classList.add("invalid");
//           phoneError.className = "error active";
//         }
//         return;
//       } else {
//         $.ajax();
//         name.value = "";
//         phone.value = "";
//         // if (form.closest('.modal')) {
//         //     form.closest('.modal').classList.remove("active");
//         // }
//         // $(".modal.success-application").addClass("active");
//         // openModal();
//       }
//     });
//   }

//   const tel = document.querySelector(".form__input--tel");

//   if (tel) {
//     IMask(tel, {
//       mask: "+{7}(000)000-00-00",
//     });
//   }
// };

// const formCalc = () => {
//   const form = document.querySelector(".form-calc__form");
//   const name = document.querySelector(".form-calc__name");
//   const phone = document.querySelector(".form-calc__phone");
//   const nameError = document.querySelector(".form-calc__name + div.error");
//   const phoneError = document.querySelector(".form-calc__phone + div.error");
//   if (name) {
//     name.addEventListener("input", function (event) {
//       if (name.validity.valid) {
//         nameError.className = "error";
//         name.classList.remove("invalid");
//       } else {
//         if (name.validity.valueMissing) {
//           nameError.className = "error active";
//           name.classList.add("invalid");
//         }
//         nameError.className = "error active";
//         name.classList.add("invalid");
//       }
//     });
//   }
//   if (phone) {
//     phone.addEventListener("input", function (event) {
//       if (phone.validity.valid) {
//         phoneError.className = "error";
//         phone.classList.remove("invalid");
//       } else {
//         if (phone.validity.valueMissing) {
//           phoneError.className = "error active";
//           phone.classList.add("invalid");
//         }
//         phoneError.className = "error active";
//         phone.classList.add("invalid");
//       }
//     });
//   }

//   if (form) {
//     form.addEventListener("submit", e => {
//       e.preventDefault();

//       if (
//         (name.value == "" && phone.value == "") ||
//         phone.value == "" ||
//         name.value == "" ||
//         phone.value.length < 16
//       ) {
//         if (name.value == "") {
//           name.classList.add("invalid");
//           nameError.className = "error active";
//         }
//         if (phone.value == "" || phone.value.length < 16) {
//           phone.classList.add("invalid");
//           phoneError.className = "error active";
//         }
//         return;
//       } else {
//         $.ajax();
//         name.value = "";
//         phone.value = "";
//       }
//     });
//   }

//   const tel = document.querySelector(".form-calc__phone");
//   if (tel) {
//     IMask(tel, {
//       mask: "+{7}(000)000-00-00",
//     });
//   }
// };

// $(function () {
//   form();
//   formCalc();
// });

const slider1 = new Swiper(".products__slider", {
  slidesPerView: "auto",
  spaceBetween: rem(4),
  watchOverflow: true,
  speed: 1000,
  navigation: {
    nextEl: ".products__slider-btn-next",
    prevEl: ".products__slider-btn-prev",
  },
  pagination: {
    el: ".products__slider-pagination",
    type: "bullets",
    clickable: true,
  },
  breakpoints: {
    769: {
      slidesPerView: "auto",
      spaceBetween: rem(1.4),
    },
  },
});

// if (window.innerWidth < 768) {
//   const slider2 = new Swiper('.delivery__tabs', {
//     slidesPerView: 'auto',
//     spaceBetween: rem(1.2),
//     watchOverflow: true,
//     speed: 1000,
//   });
// }

import image from "../../assets/images/icons/location.svg";

function init() {
  let map = new ymaps.Map("map", {
    center: [55.969346, 37.19395],
    zoom: 12,
    controls: [],
  });
  let placemark = new ymaps.Placemark(
    [55.977163, 37.249128],
    {},
    {
      iconLayout: "default#image",
      iconImageHref: image,
      iconImageSize: [84, 84],
      iconImageOffset: [-45, -65],
    },
  );

  map.geoObjects.add(placemark);
  if ($(window).width() < 769) {
    map.setCenter([56, 37.249128]);
  }
  $(window).on("resize", function () {
    if ($(window).width() < 769) {
      map.setCenter([56, 37.249128]);
    } else if ($(window).width() > 768) {
      map.setCenter([55.969346, 37.19395]);
    }
  });
}

$(function () {
  let ymaps = window.ymaps;
  if (ymaps != undefined) {
    ymaps.ready(init);
  }
});

let timer;
$(function () {
  if ($(window).width() > 768) {
    $(".dropdown").find(".header__dropdown").hide();
    $(".dropdown").on("mouseenter", function () {
      clearTimeout(timer);
      $(".dropdown").find(".header__dropdown").hide();
      $(".dropdown").removeClass("active");
      $(this).addClass("active");
      $(this).find(".header__dropdown").show();
      $(this)
        .find(".header__nav_item-icon")
        .animate({ transform: "rotate(-6deg)" }, 200);
    });

    $(".dropdown").on("mouseleave", function () {
      const drop = $(this).find(".header__dropdown");
      timer = setTimeout(function () {
        drop.hide();
        $(".dropdown").removeClass("active");
      }, 200);
      $(this)
        .find(".header__dropdown")
        .on("mouseenter", function () {
          clearTimeout(timer);
        });
      $(this)
        .find(".header__dropdown")
        .on("mouseleave", function () {
          drop.hide();
          $(".dropdown").removeClass("active");
        });
    });
  }
});

// document
//   .querySelector('input[type="file"]')
//   .addEventListener("click", function (e) {
//     const close = document.querySelector(".close");
//     const notInput = e.composedPath().includes(close);

//     if (notInput) {
//       e.preventDefault();
//       document.querySelector(".load-file__label").innerHTML = "Прикрепить файл";
//       document.querySelector('input[type="file"]').value();
//     }
//   });

// document
//   .querySelector('input[type="file"]')
//   .addEventListener("change", function () {
//     if (this.files[0]) {
//       const filePath = this.files[0].name;
//       const fileSize = this.files[0].size;
//       const mb = 1048576;
//       let size;

//       if (fileSize < mb) {
//         const sizeFull = fileSize / 1024;
//         size = sizeFull.toFixed(2) + "КБ";
//       } else {
//         const sizeFull = fileSize / 1024 / 1024;
//         size = sizeFull.toFixed(2) + "МБ";
//       }

//       const innerBtn = `<div class="load-file__uploaded">
//                       <div class="load-file__icon">
//                         <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
//                           <path d="M5.25 12.3462V8.19231C5.25 5.32468 7.60051 3 10.5 3C13.3995 3 15.75 5.32468 15.75 8.19231L15.75 13.9038C15.75 15.3377 14.5747 16.5 13.125 16.5C11.6753 16.5 10.5 15.3377 10.5 13.9038L10.5 8.19231" stroke="#00AAA3" stroke-width="2.25" stroke-linecap="round"/>
//                           <path d="M18.75 3H19.1591C24.0509 3 26.4968 3 28.1954 4.19675C28.6821 4.53964 29.1141 4.94629 29.4784 5.40433C30.75 7.00301 30.75 9.30504 30.75 13.9091V17.7273C30.75 22.172 30.75 24.3944 30.0466 26.1694C28.9158 29.0229 26.5243 31.2737 23.4925 32.338C21.6066 33 19.2453 33 14.5227 33C11.8241 33 10.4748 33 9.39717 32.6217C7.66469 32.0135 6.29813 30.7274 5.65195 29.0968C5.25 28.0825 5.25 26.8126 5.25 24.2727V18" stroke="#00AAA3" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
//                           <path d="M30.75 18C30.75 20.7614 28.5114 23 25.75 23C24.7513 23 23.5739 22.825 22.603 23.0852C21.7402 23.3164 21.0664 23.9902 20.8352 24.853C20.575 25.8239 20.75 27.0013 20.75 28C20.75 30.7614 18.5114 33 15.75 33" stroke="#00AAA3" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
//                         </svg>
//                       </div>
//                       <div class="load-file__content">
//                         <span class="load-file__text">${filePath}</span>
//                         <span class="load-file__text">${size}</span>
//                       </div>
//                       <div class="close">
//                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                           <g opacity="0.5">
//                           <path d="M19 5L5 19M5 5L19 19" stroke="#141B34" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
//                           </g>
//                         </svg>
//                       </div>`;

//       document.querySelector(".load-file__label").innerHTML = innerBtn;
//     }

//     document
//       .querySelector(".load-file__uploaded .close")
//       .addEventListener("click", function (e) {
//         e.preventDefault();
//         document.querySelector(".load-file__label").innerHTML =
//           "Прикрепить файл";
//       });
//   });

if ($(window).width() < 769) {
  const areasSlider = new Swiper(".areas__slider.swiper", {
    slidesPerView: 1,
    spaceBetween: 16,
    grid: {
      rows: 2,
      fill: "row",
    },
    pagination: {
      el: ".areas__slider-pagination",
      clickable: true,
    },
    watchSlidesProgress: true,
  });
}
