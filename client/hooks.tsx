import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { ResultType } from "./types";

export function useCommerbleState<F extends () => Promise<unknown>>(f: F): [ResultType<F>, Dispatch<SetStateAction<ResultType<F>>>] {
    const [data, mutate] = useState<ResultType<F>>(null);

    useEffect(() => {
        f?.().then(mutate);
    }, []);

    return [data, mutate];
}
