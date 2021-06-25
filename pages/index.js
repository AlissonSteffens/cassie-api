import Head from 'next/head'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Cassie API</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Essa é a API do <a href="https://www.cassiengine.com/">Cassie</a>
        </h1>

        <p className={styles.description}>
          Como o Cassie não utiliza diretamente nenhuma conexão com banco de dados, esta API provê a ele os serviços necessários de armazenamento
        </p>

        <div className={styles.grid}>
          <a href="/api/cookies" className={styles.card}>
            <h3>Cookies &rarr;</h3>
            <p>Controle de aceite para as as regras de cookies do cassie</p>
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://www.cassiengine.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Saiba mais no nosso site {' '}
          <img src="/logo.svg" alt="Cassie Logo" className={styles.logo} />
        </a>
      </footer>
    </div>
  )
}
