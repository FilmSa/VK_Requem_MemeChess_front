import Sidebar from "../components/organisms/Sidebar.jsx";
import ChessBoardSection from "../components/organisms/ChessBoardSection";


export default function PlayPage() {
  return (
    <div className="w-screen h-screen overflow-hidden text-white bg-[linear-gradient(312deg,#0b0f2b_0%,#2b1a58_13.94%,#3b1f6a_29.33%,#1a1446_50.47%,#341d5b_68.17%,#1f1852_88.46%,#0b0f2b_100%)]">
      <div className="w-full h-full flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 h-full overflow-hidden flex items-center">
            <div className="ml-[50px]">
                <ChessBoardSection />
            </div>
        </main>
      </div>
    </div>
  );
}