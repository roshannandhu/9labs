# Nine Labs — Admin guide

The admin is where you change everything on the website. Nothing here needs a developer.
A change shows on the website as soon as you press **Save**.

## Signing in

1. Open the admin address (`admin.<your domain>`).
2. Press **Continue with Google** and choose your Google account.

There is no password. Only Google e-mails listed under **Admin → Admins** can get in.

**Keep it safe:** the admin is exactly as safe as your Google account. Please switch on
*2-Step Verification* in your Google account (Google Account → Security). It is free and it
protects the admin too.

To add a colleague: **Admin → Admins → Create new**, type their Google e-mail and choose a role.
To remove someone, switch **Can sign in** off.

| Role | Can do |
|---|---|
| Owner | Everything, including adding and removing admins |
| Admin | All website content, book requests, enquiries, quiz results |
| Editor | Website content only |

## The first screen (Dashboard)

It shows what needs you: book requests waiting for approval, new enquiries, quizzes finished this
week, the most recommended activity, downloads, and any e-mails that failed. The round buttons
under **Shortcuts** jump to the most common jobs.

## Website

| Screen | What you change there |
|---|---|
| **Company details** | Company name, location, e-mail, phone, the **WhatsApp number** every button uses, the floating WhatsApp button, social links (a link shows only when it is switched on and has an address) |
| **Menu** | The links in the top menu and the highlighted button |
| **Homepage** | Which sections show and in what order; every heading, text and button of the cover, services, about, contact; optionally the first questions of the FAQ |
| **Footer** | Column titles, links to pages (About, FAQ, Privacy…), copyright line |
| **Look, SEO & tracking** | Light/dark default, brand colours, the title and description Google shows, the image used when the site is shared, Google Analytics / Tag Manager / Meta Pixel |

Tips:
- Many headings have two boxes: the heading and its **highlighted ending** (the last words, shown
  in the italic gradient style).
- If you empty a main text (a headline, a button), the site shows the original wording instead of
  a hole. Small optional lines can be left empty to hide them.
- Every screen has **Versions** at the top: open it to see earlier saves and restore one.

## The 9 cards

**The 9 cards** — open a card to change its title, short name, description, three keywords and the
**"What do you need?" choices** shown in the Talk-to-us window. A card can also send its enquiries
to a different WhatsApp number. There are always nine cards, in a fixed order: each has its own
animation.

**Talk-to-us window** — the budget and timeline choices, every label, which questions are asked,
and the wording of the WhatsApp message.

**Enquiries** — everything visitors sent from that window, saved just before WhatsApp opened. Mark
each as New / Contacted / Won / Lost and keep private notes. *Download as spreadsheet* gives you a
CSV file.

## Books

### Adding a book
**Books → Books → Create new.** Fill in the title, one-line description and chapters; on
**Cover & PDF** upload the cover (optional — a designed cover is drawn without one) and **the PDF**
(required before the book can be sent). Drag books in the list to change their order on the shelf.
Switch **Show on the website** off to hide a book without deleting it.

Each book also gets its own page you can share: `yourdomain/ebooks/<book name>`.

### How a book reaches a visitor
1. A visitor fills in the form. The request appears under **Books → Book requests** as
   *Waiting for approval* and you get an e-mail.
2. Open the request and press **Approve & send** (or **Reject**). *Approve & send all waiting*
   above the list does them all at once.
3. The visitor receives the e-mail from the company mailbox.

**Send again** e-mails the book once more; the visitor's old link stops working and a fresh one is sent.

### Book settings
- **When is a book sent?** After you approve (default), or automatically straight away.
- **How is it sent?** A private download link (default), the PDF attached, or both.
  A PDF larger than the size limit is always sent as a link, so the e-mail still arrives.
- **Link works for / Downloads per link** — how long a link lasts and how often it can be used.
- **E-mail to the visitor** — the subject and message. You can use `{{name}}`, `{{bookTitle}}`,
  `{{downloadLink}}` and `{{expiryDate}}`. **Send me a test e-mail** shows you the result
  (save first).
- **Request form** — every label of the form, whether the phone is required, the consent
  sentence, the country codes, and the messages shown after sending.

A single book can override "when" and "how" on its own **Sending** tab.

## Quiz

**How it works:** every answer gives points to one or more of the nine activities. When the
visitor finishes, the activities with the most points are recommended, with a match percentage
and a short "why" that quotes their own answers. They can send the result to you on WhatsApp or
have it e-mailed.

**Quiz settings → Questions**
- Add, remove or drag questions. Open a question to edit its answers.
- For each answer set the **points** (0 = none, 3 = strong) per activity.
- **Used in the result sentence as** — mark one question as *who they are*, one as *their main
  goal* and one as *their timing*; the result opens with a sentence built from those answers.
- **Stands alone** is for answers like "Nothing yet": choosing it clears the other choices.
- **Try the quiz** at the top lets you answer as a visitor and see what would be recommended,
  before you save.
- The admin stops you saving if an activity could never be recommended (no answer gives it points).

**Result screen** — all the wording of the result, the three-step plan and the WhatsApp message.

**Quiz results** — every finished quiz: the answers, what was recommended, and whether the visitor
opened WhatsApp or asked for the e-mail. Use the follow-up status and notes like in Enquiries.

## Content

- **Values** — the value cards in the About section.
- **FAQ** — questions and answers for `/faq`. Give questions the same **Group** to show them together.
- **Pages** — full pages: *About* (`/about`), the introduction of the *FAQ* page, *Privacy*, and
  any page you add. A new page opens at `yourdomain/<address>`; link it from **Menu** or **Footer**.
- **Images** — everything you uploaded.

## Good to know

- **Sign out** with the icon at the bottom of the left menu.
- E-mails are sent from the company mailbox. If visitors do not receive them, look under
  **Book requests** for *Failed to send* — the reason is shown on the request.
- Visitors' details (names, e-mails, phone numbers) are personal data: export and share them only
  when you need to.
