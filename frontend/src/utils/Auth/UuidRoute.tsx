import React, { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import axios from "axios";
import Loader from "@/components/ui/loader";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function UuidRoute({ children }) {
    const query = useQuery();
    const token = query.get("token");
    const client = query.get("client");

    const [loading, setLoading] = useState(true);
    const [valid, setValid] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!token || !client) {
            setValid(false);
            setLoading(false);
            return;
        }

        axios
            .get(
                `${
                    import.meta.env.VITE_API_URL
                }/user/check-token/${token}/${client}`
            )
            .then((res) => {
                if (res.data?.data) {
                    setData(res.data?.data);
                    setValid(true);
                } else {
                    setValid(false);
                }
            })
            .catch((err) => {
                console.error(err);
                setValid(false);
            })
            .finally(() => setLoading(false));
    }, [client, token]);

    if (loading) {
        return <Loader loading={loading} />;
    }

    if (!valid) return <Navigate to="/" replace />;

    return <>{React.cloneElement(children, { clientData: data })}</>;
}
