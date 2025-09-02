import Image from 'next/image';
import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react';
import { getTests, healthCheck } from '../lib/actions/test/test';
import styles from './page.module.css';

export default async function Home() {
  let dbStatus = '🔄 Testando conexão...';
  let tests: any[] = [];
  let errorMessage = '';
  let isHealthy = false;

  try {
    // Primeiro fazer health check
    isHealthy = await healthCheck();
    
    if (isHealthy) {
      // Se healthy, buscar os dados
      tests = await getTests();
      dbStatus = '✅ Banco de dados conectado com sucesso!';
    } else {
      dbStatus = '⚠️ Banco de dados acessível mas com problemas';
    }
  } catch (error) {
    dbStatus = '❌ Erro na conexão com o banco de dados';
    errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
  }

  return (
    <div className={styles.page}>
      {/* Status do Banco de Dados */}
      <div style={{
        padding: '20px',
        margin: '20px',
        borderRadius: '8px',
        backgroundColor: dbStatus.includes('✅') ? '#d4edda' : dbStatus.includes('❌') ? '#f8d7da' : '#fff3cd',
        border: `1px solid ${dbStatus.includes('✅') ? '#c3e6cb' : dbStatus.includes('❌') ? '#f5c6cb' : '#ffeaa7'}`,
        textAlign: 'center'
      }}>
        <h2>🗄️ Status do Banco de Dados</h2>
        <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{dbStatus}</p>
        
        {dbStatus.includes('✅') && (
          <div>
            <p>📊 Total de registros encontrados: <strong>{tests.length}</strong></p>
            {tests.length > 0 ? (
              <div style={{ marginTop: '15px' }}>
                <h3>📋 Registros no banco:</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
                  {tests.map((test: { id: Key | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => (
                    <div key={test.id} style={{
                      padding: '8px 16px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '4px',
                      border: '1px solid #dee2e6'
                    }}>
                      ID: {test.id} | Nome: {test.name}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
                Nenhum registro encontrado, mas a conexão está funcionando! 🎉
              </p>
            )}
          </div>
        )}
        
        {dbStatus.includes('⚠️') && (
          <div style={{ marginTop: '15px' }}>
            <p style={{ color: '#856404' }}>
              O banco está acessível mas pode ter problemas de performance ou conectividade.
            </p>
          </div>
        )}
        
        {dbStatus.includes('❌') && (
          <div style={{ marginTop: '15px' }}>
            <p style={{ color: '#721c24' }}>Erro: {errorMessage}</p>
            <p style={{ fontSize: '14px', color: '#6c757d' }}>
              Verifique se o banco de dados está acessível e se as credenciais estão corretas.
            </p>
          </div>
        )}
      </div>

      <main className={styles.main}>
        <Image
          className={styles.logo}
          src='/next.svg'
          alt='Next.js logo'
          width={180}
          height={38}
          priority
        />
        <ol>
          <li>
            Get started by editing <code>src/app/page.tsx</code>.
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href='https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app'
            target='_blank'
            rel='noopener noreferrer'
          >
            <Image
              className={styles.logo}
              src='/vercel.svg'
              alt='Vercel logomark'
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            href='https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app'
            target='_blank'
            rel='noopener noreferrer'
            className={styles.secondary}
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className={styles.footer}>
        <a
          href='https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app'
          target='_blank'
          rel='noopener noreferrer'
        >
          <Image
            aria-hidden
            src='/file.svg'
            alt='File icon'
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href='https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app'
          target='_blank'
          rel='noopener noreferrer'
        >
          <Image
            aria-hidden
            src='/window.svg'
            alt='Window icon'
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href='https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app'
          target='_blank'
          rel='noopener noreferrer'
        >
          <Image
            aria-hidden
            src='/globe.svg'
            alt='Globe icon'
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}

