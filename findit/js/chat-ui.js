// Chat pieces shared by the student Messages page and the admin Messages page: message
// bubbles with day dividers, the composer (Enter to send, photo attach), the photo viewer,
// and time labels. Each page decides whose messages are "mine" and what the panels show.
// Styles are in css/chat.css.

const CHAT_CLOSE_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

const ChatUI = {
  // Everything from the API goes through this before it's put into HTML.
  escape(value) {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(value ?? "").replace(/[&<>"']/g, (ch) => entities[ch]);
  },

  formatTime(iso) {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  },

  // Day divider text: "Today, Oct 18", "Yesterday, Oct 17", "Sat, Sep 12"
  dayLabel(iso) {
    const date = new Date(iso);
    const short = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === new Date().toDateString()) return `Today, ${short}`;
    if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${short}`;
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  },

  // Conversation list label: "Now", "5m", "3h", "Yesterday", "Sep 12"
  listTime(iso) {
    const date = new Date(iso);
    const minutes = Math.floor((Date.now() - date) / 60000);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (minutes < 1) return "Now";
    if (minutes < 60) return `${minutes}m`;
    if (date.toDateString() === new Date().toDateString()) return `${Math.floor(minutes / 60)}h`;
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  },

  /* options:
       mine         sender value shown on the right as "my" messages ("user" or "swafo")
       otherInitial avatar text beside the other side's messages
       otherName    the other side's name, for screen readers
       resolveSrc   turns a stored image path into a usable URL (admin pages add "../")
       previous     the message before this batch, so a divider isn't repeated */
  messagesHTML(messages, { mine, otherInitial, otherName, resolveSrc = (src) => src, previous = null }) {
    const esc = (value) => this.escape(value);
    const dayKey = (iso) => new Date(iso).toDateString();
    let lastDay = previous ? dayKey(previous.time) : null;

    return messages.map((m) => {
      const divider = dayKey(m.time) !== lastDay ? `<p class="day-divider">${this.dayLabel(m.time)}</p>` : "";
      lastDay = dayKey(m.time);
      if (m.sender === "system") return `${divider}<p class="msg-system">${esc(m.text)}</p>`;

      const isMine = m.sender === mine;
      const who = isMine ? "You" : otherName;
      const src = m.image ? resolveSrc(m.image) : "";
      const image = m.image
        ? `<button type="button" class="bubble-image" data-src="${esc(src)}" aria-label="Open photo from ${esc(who)}"><img src="${esc(src)}" alt=""></button>`
        : "";
      const text = m.text ? `<span class="bubble-text">${esc(m.text)}</span>` : "";

      return `${divider}
        <div class="msg ${isMine ? "msg-out" : "msg-in"}">
          ${isMine ? "" : `<span class="msg-avatar" aria-hidden="true">${esc(otherInitial)}</span>`}
          <div class="msg-body">
            <div class="bubble"><span class="visually-hidden">${esc(who)}: </span>${image}${text}</div>
            <time datetime="${esc(m.time)}">${this.formatTime(m.time)}</time>
          </div>
        </div>`;
    }).join("");
  },

  /* Wires up a composer form. Needs js/photos.js for attached photos. onSend({ text, image }) should return a Promise; if it rejects,
     the text and photo are put back and an error is shown. Enter sends, Shift+Enter adds a
     new line, and empty messages can't be sent. */
  setupComposer({ form, input, send, attachBtn, attachInput, preview, error, onSend }) {
    let pendingImage = null; // { src, name }

    const updateSend = () => {
      send.disabled = !input.value.trim() && !pendingImage;
    };
    const autosize = () => {
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
    };
    const showError = (message) => {
      error.textContent = message;
      error.hidden = !message;
    };
    const setImage = (image) => {
      pendingImage = image;
      preview.hidden = !image;
      preview.innerHTML = image
        ? `<img src="${image.src}" alt=""><span class="attach-name">${this.escape(image.name)}</span>
           <button type="button" class="attach-remove" aria-label="Remove photo">${CHAT_CLOSE_ICON}</button>`
        : "";
      updateSend();
    };

    const submit = () => {
      const text = input.value.trim();
      const image = pendingImage;
      if (!text && !image) return;

      input.value = "";
      autosize();
      setImage(null);
      showError("");

      Promise.resolve(onSend({ text, image: image ? image.src : null })).catch(() => {
        input.value = text;
        autosize();
        setImage(image);
        showError("Couldn't send that message. Try again, or send a smaller photo.");
      });
    };

    input.addEventListener("input", () => {
      autosize();
      updateSend();
    });
    // Never send in the middle of typing with an input method (isComposing).
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        submit();
      }
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submit();
    });

    attachBtn.addEventListener("click", () => attachInput.click());
    attachInput.addEventListener("change", () => {
      const [file] = attachInput.files;
      attachInput.value = ""; // so picking the same file again still fires "change"
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        showError("Only photos can be attached.");
        return;
      }
      Photos.shrink(file)
        .then((src) => {
          showError("");
          setImage({ src, name: file.name });
          input.focus();
        })
        .catch(() => showError("Couldn't read that photo. Try another one."));
    });
    preview.addEventListener("click", (event) => {
      if (!event.target.closest(".attach-remove")) return;
      setImage(null);
      input.focus();
    });

    updateSend();
    return {
      reset() {
        input.value = "";
        autosize();
        setImage(null);
        showError("");
      },
    };
  },

  // Returns open(src). Closes on the × button, Escape, or a click on the dark backdrop.
  setupLightbox({ dialog, image, close }) {
    close.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    return (src) => {
      image.src = src;
      dialog.showModal();
    };
  },
};
