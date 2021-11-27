import { Joke } from '@prisma/client';
import { DataFunctionArgs } from '@remix-run/server-runtime';
import { LoaderFunction, useLoaderData } from 'remix';
import { db } from '~/utils/db.sever';

type LoaderData = { joke: Joke };

export const loader: LoaderFunction = async ({ params }) => {
  const joke = await db.joke.findUnique({ where: { id: params.jokeId } });

  if (!joke) throw new Error('Joke not found');

  const data: LoaderData = { joke };

  return data;
};

export default function JokeRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div>
      <p>Here's your hilarious joke:</p>
      <p>{data?.joke.content}</p>
      <a href={`/jokes/${data.joke.id}`}>{data.joke.name} permalink</a>
    </div>
  );
}
