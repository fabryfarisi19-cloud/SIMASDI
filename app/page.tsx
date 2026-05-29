export default function Home() {
  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>SIMASDI</h1>
      <h2>Sistem Manajemen Surat dan Disposisi</h2>

      <br />

      <a href="/login">
        <button>Login</button>
      </a>

      <br />
      <br />

      <a href="/dashboard">
        <button>Dashboard</button>
      </a>

      <br />
      <br />

      <a href="/surat-masuk">
        <button>Surat Masuk</button>
      </a>

      <br />
      <br />

      <a href="/surat-keluar">
        <button>Surat Keluar</button>
      </a>

      <br />
      <br />

      <a href="/disposisi">
        <button>Disposisi</button>
      </a>
    </div>
  );
}