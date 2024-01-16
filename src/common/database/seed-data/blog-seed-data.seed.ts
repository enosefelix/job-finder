import { faker } from '@faker-js/faker';
import { BLOG_STATUS } from '../../interfaces';

const blogs = [
  {
    id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    title: `Cooking Catastrophes: A Novice Chef's Journey`,
    briefDescription: `Join me on a hilariously disastrous culinary adventure!`,
    body: `Today, I attempted to make a simple omelette. Little did I know, it would turn into an epic battle between me and the eggs. I cracked the first egg with confidence, only to have the entire shell end up in the bowl. 'No worries,' I thought. 'I can fish it out.' Well, let's just say my fishing skills need improvement.\n\nAs I stirred the eggs, I realized I forgot a crucial ingredient - salt. No worries, I'll just sprinkle it on top, right? Wrong. I ended up creating a salt mine on one side of the omelette.\n\nThe grand finale was flipping the omelette. It was supposed to be a majestic flip with the pan, like they do on cooking shows. Instead, my omelette did a perfect somersault, landing outside the pan. Who knew breakfast could be so acrobatic?\n\nJoin me next time as I attempt to bake cookies without burning down the kitchen! 🍳🔥`,
    image: `https://images.pexels.com/photos/1437268/pexels-photo-1437268.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`,
    readTime: `1 minute read`,
    status: BLOG_STATUS.PENDING,
  },
  {
    id: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    title: `Laundry Day Chronicles: When Socks Make a Break for It`,
    briefDescription: `Embark on a sock-tastic journey through the laundry room!`,
    body: `It was a regular Saturday, and I decided to conquer the Mount Everest of chores - the laundry. Little did I know, my socks had other plans. As I loaded the washing machine, the socks hatched an escape plan. I suspect they've been watching too many prison break movies.\n\nAs the cycle started, I heard suspicious sounds. It turns out my socks had formed a sock alliance and were attempting a daring escape through the drainage pipe. There I was, playing referee between rebellious socks.\n\nAfter negotiating a peace treaty, I thought the drama was over. But no, the dryer became the new battlefield. Socks were catapulting out, attempting to land in the forbidden realm behind the dryer. It was like a sock Olympics competition, and I was the bewildered judge.\n\nThe moral of the story? Never underestimate the rebellious spirit of socks. Laundry day will never be the same again! 👣🧦`,
    image: `https://images.pexels.com/photos/4495753/pexels-photo-4495753.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`,
    readTime: `1 minute read`,
    status: BLOG_STATUS.REJECTED,
  },
  {
    id: '3b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    title: `DIY Disasters: Unleashing my Inner Picasso on the Living Room`,
    briefDescription: `Buckle up for a rollercoaster ride of paint spills and questionable design choices!`,
    body: `Today, I decided to channel my inner artist and give my living room a makeover. Armed with paintbrushes and a color palette that resembled a unicorn threw up, I started my artistic journey. Little did I know, my walls weren't prepared for the psychedelic explosion I was about to unleash.\n\nI attempted a 'subtle' ombre effect, but it turned into a gradient that looked like it was trying to escape the wall. My attempt at creating abstract art resulted in something that can only be described as 'toddler meets Jackson Pollock.'\n\nAnd let's not talk about the DIY furniture assembly. The coffee table looks more like an abstract sculpture, and the bookshelf might be holding books, but it's also holding its breath, fearing its imminent collapse.\n\nJoin me next time as I contemplate hiring professionals to fix my 'masterpiece.' 🎨🤦‍♂️`,
    image: `https://images.pexels.com/photos/7563521/pexels-photo-7563521.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`,
    readTime: `1 minute read`,
    status: BLOG_STATUS.APPROVED,
  },
  {
    id: '4b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    title: `Epic Quests: Navigating the Treacherous Aisles of the Grocery Store`,
    briefDescription: `Discover the heroic journey of a grocery shopper facing the perils of forgotten shopping lists and aggressive shopping carts!`,
    body: `Armed with a crumpled shopping list and the determination of a warrior entering battle, I ventured into the perilous realm of the grocery store. Little did I know, my shopping cart had a mind of its own. It veered left when I wanted right, crashed into innocent cereal boxes, and engaged in cart-to-cart combat with unsuspecting shoppers.\n\nThe quest for a simple loaf of bread turned into a labyrinthine adventure. I wandered into the exotic food aisle, where I encountered mysterious ingredients that I couldn't pronounce, let alone cook with. 'Quinoa? Is that a spell from a wizard's cookbook?'\n\nAnd let's not forget the epic battle at the checkout. The person behind me had a cartload of items, and I had precisely 10 items or fewer. The tension was palpable, and I could feel the judgmental gaze of the cashier.\n\nStay tuned for the next chapter as I attempt to conquer the self-checkout labyrinth. 🛒😅`,
    image: `https://images.pexels.com/photos/5498024/pexels-photo-5498024.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`,
    readTime: `1 minute read`,
    status: BLOG_STATUS.APPROVED,
  },
  {
    id: '5b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    title: `Pet Parenting 101: A Comedy of Furry Errors`,
    briefDescription: `Embark on a journey through the whimsical world of pet antics and the misadventures of a well-intentioned pet parent!`,
    body: `Being a pet parent is a rollercoaster ride of joy, fur, and questionable decisions. Today, my cat decided that my keyboard was the perfect place for a nap. Mid-email, she gracefully sauntered across the keys, creating a masterpiece of random characters that even Shakespeare would envy.\n\nI attempted to teach my dog a new trick, but he had other plans. 'Sit' turned into 'spin in circles,' and 'stay' translated to 'I'll sit for a millisecond before sprinting around the house like a maniac.' My neighbors now think I'm hosting a canine circus.\n\nAnd let's not forget the great litter box escape. My cat, in an act of feline rebellion, managed to scatter litter throughout the entire house. I now have a crunchy carpet, courtesy of my furry little artist.\n\nStay tuned for the next episode of 'Pet Parent Chronicles,' where I attempt to decipher the language of chirps, meows, and barks. 🐾😆`,
    image: `https://images.pexels.com/photos/16652420/pexels-photo-16652420/free-photo-of-a-pug-in-dogs-clothing-in-a-park.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`,
    readTime: `1 minute read`,
    status: BLOG_STATUS.APPROVED,
  },
];

faker.seed(11224);

export const blogSeed = blogs.map((blog) => {
  return {
    ...blog,
  };
});
