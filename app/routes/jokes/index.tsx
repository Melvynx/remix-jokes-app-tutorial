import type { Joke } from '@prisma/client';
import { LoaderFunction, useLoaderData } from 'remix';
import { db } from '~/utils/db.sever';

type RandomJoke = {
  joke: Joke;
};

export const loader: LoaderFunction = async () => {
  const count = await db.joke.count();

  const random = Math.floor(Math.random() * count);

  const [joke] = await db.joke.findMany({
    take: 1,
    skip: random,
    select: {
      id: true,
      name: true,
      content: true,
    },
  });

  return { joke };
};

export default function JokesIndexRoute() {
  const data = useLoaderData<RandomJoke>();
  return (
    <div>
      <p>Here's a random joke:</p>
      <p>{data.joke.content}</p>
    </div>
  );
}
