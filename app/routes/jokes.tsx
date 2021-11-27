import { User } from '@prisma/client';
import { Link, LinksFunction, LoaderFunction, Outlet, useLoaderData } from 'remix';
import { db } from '~/utils/db.sever';
import { getUserId } from '~/utils/session.server';
import stylesUrl from '../styles/jokes.css';

export const links: LinksFunction = () => {
  return [
    {
      rel: 'stylesheet',
      href: stylesUrl,
    },
  ];
};

type LoaderData = { jokes: { id: string; name: string }[]; user: User };

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  const user = userId ? await db.user.findUnique({ where: { id: userId } }) : null;

  const jokes = await db.joke.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return {
    jokes,
    user,
  };
};

export default function JokesRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div className="jokes-layout">
      <header className="jokes-header">
        <div className="container">
          <h1 className="home-link">
            <Link to="/" title="Remix Jokes" aria-label="Remix Jokes">
              <span className="logo">🤪</span>
              <span className="logo-medium">J🤪KES</span>
            </Link>
          </h1>
          {data.user ? (
            <div className="jokes-logout-container">
              <p>Hi {data.user.username}</p>
              <a href="/logout">Logout</a>
            </div>
          ) : (
            <a href="/login">Login</a>
          )}
        </div>
      </header>
      <main className="jokes-main">
        <div className="container">
          <div className="jokes-list">
            <Link to=".">Get a random joke</Link>
            <p>Here are a few more jokes to check out:</p>
            <ul>
              {data.jokes.map((joke) => (
                <li key={joke.id}>
                  <Link to={joke.id}>{joke.name}</Link>
                </li>
              ))}
            </ul>
            <Link to="new" className="button">
              Add your own
            </Link>
          </div>
          <div className="jokes-outlet">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
