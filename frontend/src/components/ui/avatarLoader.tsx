import { motion } from "framer-motion";

const AvatarLoader = ({ size = 8, color = "white" }) => (
    <motion.div
        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
    >
        <div
            className={`w-${size} h-${size} border-3 border-t-transparent rounded-full`}
            style={{
                borderColor: color,
                borderTopColor: "transparent",
            }}
        />
    </motion.div>
);

export default AvatarLoader;
