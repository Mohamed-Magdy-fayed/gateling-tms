import { useProgress } from "@/components/general/progress-provider";
import { Progress } from "@/components/ui/progress";

export function ProgressBar() {
    const { progress } = useProgress();
    return progress > 0 && progress < 100 ? (
        <Progress className="absolute top-0 z-50" value={progress} />
    ) : null;
}