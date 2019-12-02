import * as React from "react";
import ReactDOM from "react-dom";

import Grid from '@material-ui/core/Grid';
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Slider from '@material-ui/core/Slider';
import Input from '@material-ui/core/Input';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";

interface Twttr {
    widgets: {
        createTweet(id: string, container: HTMLElement, options: { width: number }): Promise<HTMLElement>;
    };
}
declare const twttr: Twttr;

interface TweetProps {
    tweet: string;
}

function Tweet({ tweet }: TweetProps) {
    const containerRef = React.useRef<HTMLDivElement>();

    React.useEffect(() => {
        const t = twttr.widgets.createTweet(tweet, containerRef.current, { width: Math.min(window.innerWidth - 20, 500) });
        return () => {
            t.then(e => {
                if (e && e.parentNode) {
                    e.parentNode.removeChild(e);
                }
            });
        };
    }, [tweet]);

    return <div ref={containerRef}></div>
}

interface DataSource {
    key: React.Key;
    name: string;
    url: string;
}
const sources: DataSource[] = [
    { key: 2019, name: "2019", url: "https://gist.githubusercontent.com/simdnyan/a82a49ed5a2d4e559b393f20746a6587/raw/0d02b2d846e2af1748baf4ccd739859310efd2d1/20181201-20191130" },
    { key: 2018, name: "2018", url: "https://gist.githubusercontent.com/simdnyan/1f9f19c523100ceeadc8f67b017b7ddb/raw/45f69b54ac0201b3c028e7ccc7325c04fc384e45/20171201-20181130" },
    { key: 2017, name: "2017", url: "https://gist.githubusercontent.com/simdnyan/02fbf4106ad9bd39cf02eb418ced5fa5/raw/4b5cfe9712d0c1ea5a2f81ffd71ffe9d14deb6bd/20161201-20171130" },
];

const INITIAL_YEAR = sources[0].key;

interface ViewerProps {
    url: string;
}

function Viewer({ url }: ViewerProps) {
    const [loading, setLoading] = React.useState(0);
    const [count, setCount] = React.useState(0);

    const handleDecrement10 = React.useCallback(() => { setCount(v => v - 10); }, [setCount]);
    const handleDecrement = React.useCallback(() => { setCount(v => v - 1); }, [setCount]);
    const handleIncrement = React.useCallback(() => { setCount(v => v + 1); }, [setCount]);
    const handleIncrement10 = React.useCallback(() => { setCount(v => v + 10); }, [setCount]);

    const [tweets, setTweets] = React.useState<string[]>(null);
    React.useEffect(() => {
        const abort = new AbortController();
        let loaded = false;

        setLoading(c => c + 1);
        fetch(url, { signal: abort.signal })
            .then(response => response.text())
            .then(data => {
                loaded = true;
                setLoading(c => c - 1);
                if (abort.signal.aborted)
                    return;

                const results = data.trim().split("\n");
                setTweets(results);
                setCount(0);
            });

        return () => {
            abort.abort();
            if (!loaded)
                setLoading(c => c - 1);
        };
    }, [url]);

    return <Grid container spacing={2} >
        <Grid container item xs={12} spacing={2}>
            <Grid item>
                <Input
                    autoFocus
                    value={count}
                    margin="dense"
                    onChange={(event) => {
                        setCount(parseInt(event.target.value));
                    }}
                    onBlur={(event) => {
                        const current = parseInt(event.target.value);
                        setCount(Math.min(Math.max(0, current), tweets.length - 1));
                    }}
                    inputProps={{
                        step: 1,
                        min: 0,
                        max: tweets ? tweets.length : 0,
                        type: 'number',
                        'aria-labelledby': 'input-slider',
                    }}
                />
            </Grid>
            <Grid item xs>
                <Slider
                    value={typeof count === 'number' ? count : 0}
                    onChange={(_event, newValue) => {
                        if (Array.isArray(newValue)) {
                            newValue = newValue[0];
                        }
                        setCount(newValue);
                    }}
                    min={0}
                    max={tweets ? tweets.length : 0}
                    aria-labelledby="input-slider"
                />
            </Grid>
        </Grid>
        <Grid item xs={12}>
            <ButtonGroup>
                <Button disabled={loading !== 0} onClick={handleDecrement10}>-10</Button>
                <Button disabled={loading !== 0} onClick={handleDecrement}>-1</Button>
                <Button disabled={loading !== 0} onClick={handleIncrement}>+1</Button>
                <Button disabled={loading !== 0} onClick={handleIncrement10}>+10</Button>
            </ButtonGroup>
        </Grid>
        <Grid item xs={12}>
            {tweets && <Tweet tweet={tweets[count]} />}
        </Grid>
    </Grid>
}

function App() {
    const [source, setSource] = React.useState<React.Key>(INITIAL_YEAR);
    const onChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setSource(e.target.value);
    }, [setSource]);

    const currentSource = sources.find(t => t.key === source);
    return <div style={{ overflow: "hidden" }}>
        <div>
            <FormControl>
                <InputLabel id="year-select-label">Year</InputLabel>
                <Select labelId="year-select-label" title="Year" onChange={onChange} value={currentSource.key}>
                    {
                        sources.map(({ key, name }) => <MenuItem key={key} value={key} selected={key === source}>{name}</MenuItem>)
                    }
                </Select>
            </FormControl>
        </div>
        <Viewer url={currentSource.url} />
    </div>;
}

ReactDOM.render(<App />, document.getElementById("app"));
