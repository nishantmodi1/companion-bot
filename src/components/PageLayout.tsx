
interface Props { children: React.ReactNode; }

const PageLayout: React.FC<Props> = ({ children }) => (
  <>
    <div
      className="relative flex overflow-hidden flex-col"
      style={{ 
        display:'flex', 
        flexDirection:'column', 
        background: '#07071a',
        minHeight: '100dvh',
        width: '100%',
        maxWidth: '100vw',
        overflowY: 'hidden',
        overflowX: 'hidden',
      }}
    >
      {/* Content */}
      <div className="relative flex flex-col flex-1 w-full mx-auto my-1 px-0 sm:px-2 md:px-4 lg:px-6"
        style={{ 
          maxWidth: '1100px',
          width: '100%',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
        {children}
      </div>
    </div>
  </>
);

export default PageLayout;