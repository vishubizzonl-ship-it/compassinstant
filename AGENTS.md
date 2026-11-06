## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## UI verification rule (mandatory)

- Har UI change ke baad ye steps follow karo, is order mein:
  1. `npx astro build` chalao aur pass hona confirm karo.
  2. `dist/_astro/*.css` mein naye classes ke rules grep karke check karo ki wo sahi values mein hain.
  3. `src/layouts/Layout.astro` mein `global.css` ka import hona confirm karo.
  4. User ko `localhost:4321` ka link do aur screenshot maango.
  5. Sirf user ke confirm karne ke baad `git commit` karo.
- Build pass hona visual proof nahi hai. Styling ka sabut sirf screenshot se maana jayega.
- Tailwind theme mein spacing tokens (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`) max-width classes se collide karte hain. Isliye `max-w-*` ke liye hamesha arbitrary rem values use karo, jaise `max-w-[48rem]`.
- Naya server start mat karo. Sirf `bash ~/dev-one.sh compassinstant` use karo.
- Project folder ko delete ya dobara create mat karo bina user ki explicit permission ke.

## Setup and layout rules (mandatory)

- Naye project mein pehle ek CSS test karo: `<div class="bg-red-500 p-4">` browser mein lal dikhna chahiye, warna aage kaam mat karo.
- Tailwind ke default naam (`sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`) theme spacing ke liye use mat karo. `max-w-*` ke liye arbitrary rem values use karo.
- Har page `src/layouts/Layout.astro` use kare, aur ye layout `global.css` import kare.
- Har page ko 375px width par check karo. Mobile par grid single column ho, multi-column sirf `lg:` par.
- Ek session mein ek hi kaam karo. Naya feature shuru karne se pehle pichla kaam commit karo.
