import { motion } from "framer-motion";

type LoaderProps = {
  loading: boolean;
  message?: string;
};

const Loader = ({ loading, message }: LoaderProps) => {
  if (!loading) return null;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-950 z-50">
      <motion.div
        className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 1,
          ease: "linear",
        }}
      />
      {message && (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          {message}
        </p>
      )}
    </div>
  );
};

export default Loader;
