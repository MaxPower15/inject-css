# Javascript CSS Injection - What? Why?

If you've ever had to drop some HTML/CSS in someone else's site, you know that CSS specificity
issues can be a pain to deal with. All of a sudden your .button class has a huge font and 
underlined text, and the rule that's applying it is so specific that you can't hope to come up 
with a generalized solution. Javascript CSS injection seeks to solve that problem.

The idea is that inserting a &lt;style&gt; element into the DOM gives us better control than 
modifying inline style properties. With a few simple transformations, your CSS can be modified 
to be the most specific on the page, and to only target the elements you care about.

*Note that this plugin does not absolutely guarantee the most specific selector possible in CSS.*
The selectors are comprised of a tag-id combo for every ancestor node of the target, and the 
target node itself. To get a more specific selector, we would need to explicitly target every attributes
for each node. But that's slow and not cross-browser compatible. That said, the situations where someone
would have a more specific selector are rare and mostly contrived. You can also use the "important" option
to get around the problem.

## Well what about inline styles?

Inline styles, besides being ugly, are an imperfect solution. Some problems I've run into:

- No concept of CSS inheritance. What you set is what you get, cascading be damned.
- No true ability to "set back to default". You can only reset an inline css property with another inline property.
- No CSS pseudo-selectors. For example, being able to set :hover directly in CSS is much nicer than setting up JS hover events and classes.

With injected &lt;style&gt; attributes, we get all the benefits that come with external stylesheets, 
along with all the power of javascript.

## When do I want to use injected styles?

- When you're dropping an HTML/CSS/JS widget in someone else's site, and you don't want to allow them to customize it.
- When you want to temporarily set a CSS property, and it's important that it go back to its original state.

## When do I want to avoid injected styles?

- Inline styles are *fast*, so they're still better for animation or extremely frequent style changes.
- In some situations, you want people to be able to override (theme) your CSS. Injected styles will mostly prevent that.

## Usage

See the [demo page](http://dl.dropbox.com/u/124192/websites/inject-css/index.html) for usage.

## Known Issues

1. Semicolons or colons inside quotes in a CSS property are parsed as if they are NOT in quotes, thereby corrupting 
a CSS Rule. If issues concerning this crop up, I will add a fix, but I can't imagine that situation being common.
2. If the ID or tag name in any of the target element's ancestors are changed, the injected CSS will not work.

## Author

Max Schnur

https://github.com/MaxPower15

http://twitter.com/#!/MaxSchnur

