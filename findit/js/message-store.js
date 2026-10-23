// Conversations between students and SWAFO, shared by the student Messages page
// (user/messages.html) and the admin Messages page (admin/messages.html).
//
// Until there's a backend, everything lives in this browser's localStorage, so a message sent
// in one tab shows up in another tab of the same browser (not on other devices). The backend
// replaces this file; see BACKEND-HANDOFF.md.
//
// Open any page with ?reset-demo to start over with the sample conversations.

const MessageStore = (() => {
  // v2: a conversation stores its item's locationId (js/data/locations.js) instead of a foundAt
  // place name. v1 conversations (from older copies of the demo) are ignored.
  const KEY = "findit.messages.v2";

  const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const daysAgoAt = (days, hours, minutes) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  };
  const on = (year, month, day, hours, minutes) => new Date(year, month - 1, day, hours, minutes).toISOString();

  const JUAN = { name: "Juan Dela Cruz", email: "student@example.com" };

  // status: "pending" | "matched" | "ready" | "claimed" (same as admin reports)
  // icon: phone | bottle | idCard | key | wallet | backpack | box
  // reportType: what the student reported. "lost" can start a claim, "found" means they found it.
  // locationId: where the item was found (js/data/locations.js)
  // startedBy: "swafo" | "user". userUnread / swafoUnread: unread counts for each side.
  function seed() {
    const conversations = [
      { id: "conv-1", student: JUAN, itemId: "FI-0231", itemNumber: 1, itemName: "Phone", icon: "phone", status: "matched", reportType: "found", locationId: "food-square", startedBy: "user", lastMessage: "Is it still available?", userUnread: 2, swafoUnread: 0 },
      { id: "conv-2", student: JUAN, itemId: "FI-0229", itemNumber: 2, itemName: "Aquaflask", icon: "bottle", status: "ready", reportType: "lost", locationId: "food-square", startedBy: "user", lastMessage: "SWAFO: Claim approved", userUnread: 1, swafoUnread: 0 },
      { id: "conv-4", student: JUAN, itemId: "FI-0224", itemNumber: 4, itemName: "School ID", icon: "idCard", status: "ready", reportType: "lost", locationId: "magdiwang-gate", startedBy: "swafo", lastMessage: "Great! I'll come by tomorrow.", userUnread: 0, swafoUnread: 1 },
      { id: "conv-5", student: JUAN, itemId: "FI-0222", itemNumber: 5, itemName: "Dorm keys", icon: "key", status: "matched", reportType: "lost", locationId: "male-dorms", startedBy: "user", lastMessage: "Can you send a photo?", userUnread: 0, swafoUnread: 0 },
      { id: "conv-8", student: JUAN, itemId: "FI-0221", itemNumber: 8, itemName: "Wallet", icon: "wallet", status: "claimed", reportType: "lost", locationId: "ugnayang-la-salle", startedBy: "swafo", lastMessage: "Thank you po!", userUnread: 0, swafoUnread: 0 },
      { id: "conv-9", student: JUAN, itemId: "FI-0219", itemNumber: 9, itemName: "Backpack", icon: "backpack", status: "ready", reportType: "lost", locationId: "aea-main", startedBy: "user", lastMessage: "Please bring your ID.", userUnread: 0, swafoUnread: 0 },

      // Other students, so the admin inbox isn't only Juan
      { id: "conv-10", student: { name: "Maria Santos", email: "maria.santos@example.com" }, itemId: "FI-0231", itemNumber: 1, itemName: "iPhone 13", icon: "phone", status: "matched", reportType: "lost", locationId: "food-square", startedBy: "user", lastMessage: "Thank you! The lock screen is a photo of my dog.", userUnread: 0, swafoUnread: 1 },
      { id: "conv-11", student: { name: "Paolo Reyes", email: "paolo.reyes@example.com" }, itemId: "FI-0230", itemNumber: 3, itemName: "Black Hoodie", icon: "box", status: "matched", reportType: "lost", locationId: "aea-main", startedBy: "user", lastMessage: "That matches. We'll message you once it's ready for pick-up.", userUnread: 0, swafoUnread: 0 },
      { id: "conv-12", student: { name: "Jo Villanueva", email: "jo.villanueva@example.com" }, itemId: "FI-0216", itemNumber: 6, itemName: "Calculator", icon: "box", status: "pending", reportType: "lost", locationId: "food-square", startedBy: "user", lastMessage: "Hello po, did anyone turn in a calculator at the canteen?", userUnread: 0, swafoUnread: 1 },
      { id: "conv-13", student: { name: "Ana Cruz", email: "ana.cruz@example.com" }, itemId: "FI-0214", itemNumber: 7, itemName: "Water tumbler", icon: "bottle", status: "claimed", reportType: "lost", locationId: "ugnayang-la-salle", startedBy: "swafo", lastMessage: "Tumbler claimed at the SWAFO office", userUnread: 0, swafoUnread: 0 },
    ];

    // sender: "user" (the student) | "swafo" | "system". image: URL or null.
    const messages = [
      { id: "m-101", conversationId: "conv-1", sender: "user", text: "Hi! I found a phone at the Food Square and reported it. It's still with me.", time: daysAgoAt(1, 16, 12), image: null },
      { id: "m-102", conversationId: "conv-1", sender: "swafo", text: "Thank you! Someone just reported losing a phone that matches the one you found.", time: minutesAgo(5), image: null },
      { id: "m-103", conversationId: "conv-1", sender: "swafo", text: "Is it still available?", time: minutesAgo(2), image: null },

      { id: "m-201", conversationId: "conv-2", sender: "user", text: "Good morning po! I submitted a claim for the Aquaflask found at the canteen.", time: minutesAgo(150), image: null },
      { id: "m-202", conversationId: "conv-2", sender: "swafo", text: "Thanks! We're checking the details you gave.", time: minutesAgo(120), image: null },
      { id: "m-203", conversationId: "conv-2", sender: "system", text: "SWAFO approved your claim", time: minutesAgo(60), image: null },

      { id: "m-401", conversationId: "conv-4", sender: "swafo", text: "Hi! This is SWAFO. We found a school ID at the library. Can you tell me the name on it?", time: daysAgoAt(0, 9, 41), image: "assets/images/sample-school-id.svg" },
      { id: "m-402", conversationId: "conv-4", sender: "user", text: "Hello po! It should be Juan Dela Cruz, BS Computer Science.", time: daysAgoAt(0, 9, 43), image: null },
      { id: "m-403", conversationId: "conv-4", sender: "swafo", text: "Thanks, that matches. You can claim it at the SWAFO office, Mon–Fri 8AM–5PM.", time: daysAgoAt(0, 9, 44), image: null },
      { id: "m-404", conversationId: "conv-4", sender: "system", text: "SWAFO marked this item as Ready for claim", time: daysAgoAt(0, 9, 45), image: null },
      { id: "m-405", conversationId: "conv-4", sender: "user", text: "Great! I'll come by tomorrow morning.", time: daysAgoAt(0, 9, 46), image: null },

      { id: "m-501", conversationId: "conv-5", sender: "user", text: "Hello! Has anyone turned in dorm keys with a blue lanyard?", time: daysAgoAt(1, 14, 5), image: null },
      { id: "m-502", conversationId: "conv-5", sender: "swafo", text: "Hi! We have a few sets of keys from the Narra dorm.", time: daysAgoAt(1, 15, 20), image: null },
      { id: "m-503", conversationId: "conv-5", sender: "swafo", text: "Can you send a photo?", time: daysAgoAt(1, 15, 21), image: null },

      { id: "m-801", conversationId: "conv-8", sender: "swafo", text: "Hi! A wallet matching your report was turned in at the ULS gym.", time: on(2026, 9, 11, 10, 2), image: null },
      { id: "m-802", conversationId: "conv-8", sender: "user", text: "That's mine po! I'll claim it tomorrow.", time: on(2026, 9, 11, 10, 15), image: null },
      { id: "m-803", conversationId: "conv-8", sender: "system", text: "Wallet claimed at the SWAFO office", time: on(2026, 9, 12, 9, 30), image: null },
      { id: "m-804", conversationId: "conv-8", sender: "user", text: "Thank you po!", time: on(2026, 9, 12, 9, 35), image: null },

      { id: "m-901", conversationId: "conv-9", sender: "user", text: "Hi! When can I pick up my backpack?", time: on(2026, 9, 10, 13, 0), image: null },
      { id: "m-902", conversationId: "conv-9", sender: "swafo", text: "Here's the backpack we have. You can pick it up Mon–Fri, 8AM–5PM.", time: on(2026, 9, 10, 13, 20), image: "assets/images/item-placeholder.svg" },
      { id: "m-903", conversationId: "conv-9", sender: "swafo", text: "Please bring your ID.", time: on(2026, 9, 10, 13, 21), image: null },

      { id: "m-1001", conversationId: "conv-10", sender: "user", text: "Good morning po! I lost my iPhone 13 near Magdiwang Gate earlier. It has a clear case.", time: minutesAgo(40), image: null },
      { id: "m-1002", conversationId: "conv-10", sender: "swafo", text: "Hi Maria! A phone was reported found at the Food Square. We're checking with the finder now.", time: minutesAgo(30), image: null },
      { id: "m-1003", conversationId: "conv-10", sender: "user", text: "Thank you! The lock screen is a photo of my dog.", time: minutesAgo(10), image: null },

      { id: "m-1101", conversationId: "conv-11", sender: "user", text: "Hi! I think the black hoodie found at the library is mine.", time: minutesAgo(180), image: null },
      { id: "m-1102", conversationId: "conv-11", sender: "swafo", text: "Hello Paolo! Can you describe anything unique about it?", time: minutesAgo(170), image: null },
      { id: "m-1103", conversationId: "conv-11", sender: "user", text: "It has a small tear on the left sleeve and my initials inside the collar.", time: minutesAgo(165), image: null },
      { id: "m-1104", conversationId: "conv-11", sender: "swafo", text: "That matches. We'll message you once it's ready for pick-up.", time: minutesAgo(150), image: null },

      { id: "m-1201", conversationId: "conv-12", sender: "user", text: "Hello po, did anyone turn in a calculator at the canteen?", time: daysAgoAt(1, 17, 30), image: null },

      { id: "m-1301", conversationId: "conv-13", sender: "swafo", text: "Hi Ana! A tumbler matching your report was turned in at the gym.", time: on(2026, 9, 9, 11, 0), image: null },
      { id: "m-1302", conversationId: "conv-13", sender: "user", text: "Yay, thank you po! I'll get it later.", time: on(2026, 9, 9, 11, 12), image: null },
      { id: "m-1303", conversationId: "conv-13", sender: "system", text: "Tumbler claimed at the SWAFO office", time: on(2026, 9, 9, 15, 40), image: null },
    ];

    // A conversation's updatedAt is its newest message (sorts the lists, "2m" labels).
    conversations.forEach((c) => {
      c.updatedAt = messages
        .filter((m) => m.conversationId === c.id)
        .reduce((latest, m) => (m.time > latest ? m.time : latest), "");
    });

    return { conversations, messages };
  }

  let memory = null; // used only if this browser blocks localStorage

  function read() {
    if (memory) return memory;
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) return JSON.parse(saved);
      const data = seed();
      localStorage.setItem(KEY, JSON.stringify(data));
      return data;
    } catch {
      memory = seed(); // storage blocked: this tab works on its own, nothing is shared
      return memory;
    }
  }

  // Throws if storage is full (big photos); callers turn that into an error message.
  function write(data) {
    if (memory) memory = data;
    else localStorage.setItem(KEY, JSON.stringify(data));
  }

  const find = (data, id) => data.conversations.find((c) => c.id === id);
  const newestFirst = (a, b) => (a.updatedAt < b.updatedAt ? 1 : -1);

  return {
    // All conversations (admin), or just one student's.
    conversations({ studentEmail } = {}) {
      return read().conversations
        .filter((c) => !studentEmail || c.student.email === studentEmail)
        .sort(newestFirst);
    },

    messages(conversationId) {
      return read().messages.filter((m) => m.conversationId === conversationId);
    },

    addMessage(conversationId, { sender, text = "", image = null }) {
      const data = read();
      const conversation = find(data, conversationId);
      const message = {
        id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        conversationId,
        sender,
        text,
        time: new Date().toISOString(),
        image,
      };
      data.messages.push(message);
      conversation.lastMessage = text || "Sent a photo";
      conversation.updatedAt = message.time;
      // The other side gets an unread message. System messages are SWAFO actions, so they notify the student.
      if (sender === "user") conversation.swafoUnread += 1;
      else conversation.userUnread += 1;
      write(data);
      return message;
    },

    // side: "user" (the student read it) or "swafo"
    markRead(conversationId, side) {
      const data = read();
      const key = side === "swafo" ? "swafoUnread" : "userUnread";
      const conversation = find(data, conversationId);
      if (!conversation[key]) return;
      conversation[key] = 0;
      write(data);
    },

    update(conversationId, changes) {
      const data = read();
      Object.assign(find(data, conversationId), changes);
      write(data);
    },

    unreadFor(side) {
      const key = side === "swafo" ? "swafoUnread" : "userUnread";
      return read().conversations.reduce((total, c) => total + c[key], 0);
    },

    // Runs the callback when another tab changes the conversations.
    subscribe(callback) {
      window.addEventListener("storage", (event) => {
        if (event.key === KEY || event.key === null) callback();
      });
    },

    reset() {
      memory = null;
      try {
        localStorage.removeItem(KEY);
      } catch {
        // nothing saved
      }
    },
  };
})();

if (new URLSearchParams(window.location.search).has("reset-demo")) MessageStore.reset();
