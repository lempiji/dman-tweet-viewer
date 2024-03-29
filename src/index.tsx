import * as React from "react";
import ReactDOM from "react-dom";

import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Slider from '@material-ui/core/Slider';
import Input from '@material-ui/core/Input';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";

import IconButton from "@material-ui/core/IconButton";
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import StopIcon from '@material-ui/icons/Stop';
import GitHubIcon from '@material-ui/icons/GitHub';

interface Twttr {
    widgets: {
        createTweet(id: string, container: HTMLElement, options: { width: number }): Promise<HTMLElement>;
    };
}
declare const twttr: Twttr;

interface TweetProps {
    tweet: string;
    onLoad?: () => void,
}

function Tweet({ tweet, onLoad }: TweetProps) {
    const containerRef = React.useRef<HTMLDivElement>();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(false);

    React.useEffect(() => {
        const t = twttr.widgets.createTweet(tweet, containerRef.current, { width: Math.min(window.innerWidth - 20, 500) });
        setLoading(true);
        setError(false);
        t.then(() => { 
            setLoading(false);
            setError(!containerRef.current.firstChild);
            if (onLoad) {
                onLoad();
            }
        });
        return () => {
            t.then(e => {
                if (e && e.parentNode) {
                    e.parentNode.removeChild(e);
                }
            });
        };
    }, [tweet, containerRef]);

    return <>
        <div key="container" ref={containerRef}></div>
        {loading && (<div>Loading...</div>)}
        {error && (<div>Not Found</div>)}
    </>;
}

interface DataSource {
    key: React.Key;
    name: string;
    url: string;
}
const sources: DataSource[] = [
    { key: 2022, name: "2022", url: "https://gist.githubusercontent.com/simdnyan/2696812b5d4aa4aa4009a3f31fa9dfb7/raw/3e931e8ae85c283f8acb776167bdc68a1f2ae512/20211201-20221130" },
    { key: 2021, name: "2021", url: "https://gist.githubusercontent.com/simdnyan/fc703dbd3a3805ce537a77cbc7269c06/raw/fca790ba683f6e3003dc4aa78af0291e639f8e97/20201201-20211130" },
    { key: 2020, name: "2020", url: "https://gist.githubusercontent.com/simdnyan/7ece810139961663819aa3c64448874c/raw/ac6d5ce3a0b2ea2a96f4f6dc2a7d6ec86ae5f4da/20191201-20201130" },
    { key: 2019, name: "2019", url: "https://gist.githubusercontent.com/simdnyan/a82a49ed5a2d4e559b393f20746a6587/raw/0d02b2d846e2af1748baf4ccd739859310efd2d1/20181201-20191130" },
    { key: 2018, name: "2018", url: "https://gist.githubusercontent.com/simdnyan/1f9f19c523100ceeadc8f67b017b7ddb/raw/45f69b54ac0201b3c028e7ccc7325c04fc384e45/20171201-20181130" },
    { key: 2017, name: "2017", url: "https://gist.githubusercontent.com/simdnyan/02fbf4106ad9bd39cf02eb418ced5fa5/raw/4b5cfe9712d0c1ea5a2f81ffd71ffe9d14deb6bd/20161201-20171130" },
];

const INITIAL_YEAR = sources[0].key;
const AUTOPLAY_INTERVAL = 2000;

interface ViewerProps {
    url: string;
}

function useSignal(): [boolean, () => void] {
    const [signalCount, setSignalCount] = React.useState(false);
    const notify = React.useCallback(() => { setSignalCount(current => !current); }, [setSignalCount]);
    return [signalCount, notify];
}

function Viewer({ url }: ViewerProps) {
    const [loading, setLoading] = React.useState(0);
    const [count, setCount] = React.useState(0);
    const [tweets, setTweets] = React.useState<string[]>(null);
    const [autoPlay, setAutoPlay] = React.useState(false);
    const [tweetLoaded, notify] = useSignal();

    const handleDecrement10 = React.useCallback(() => { setCount(v => Math.max(0, v - 10)); }, [setCount]);
    const handleDecrement = React.useCallback(() => { setCount(v => Math.max(0, v - 1)); }, [setCount]);
    const handleIncrement = React.useCallback(() => { setCount(v => Math.min(v + 1, tweets.length - 1)); }, [setCount, tweets]);
    const handleIncrement10 = React.useCallback(() => { setCount(v => Math.min(v + 10, tweets.length - 1)); }, [setCount, tweets]);

    const handleTweetLoaded = React.useCallback(() => { notify(); }, [notify]);
    const handleTogglePlay = React.useCallback(() => { setAutoPlay(current => !current)}, [setAutoPlay]);

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

    React.useEffect(()=>{
        if (autoPlay) {
            const timer = setTimeout(() => {
                setCount(c => Math.min(c + 1, tweets.length - 1));
            }, AUTOPLAY_INTERVAL);
            return () => {
                clearTimeout(timer);
            };
        }
    }, [autoPlay, tweetLoaded, tweets]);

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
                        const max = tweets ? tweets.length - 1 : 0;
                        setCount(Math.min(Math.max(0, current), max));
                    }}
                    inputProps={{
                        step: 1,
                        min: 0,
                        max: tweets ? tweets.length : 0,
                        type: 'number',
                        'aria-labelledby': 'input-slider',
                    }}
                />
                {tweets && `/${tweets.length - 1}`}
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
            <Button disabled={loading !== 0} onClick={handleTogglePlay} variant="outlined" color="primary">
                {
                    autoPlay ? (<StopIcon></StopIcon>) : (<PlayArrowIcon></PlayArrowIcon>)
                }
            </Button>
        </Grid>
        <Grid item xs={12}>
            {tweets && <Tweet tweet={tweets[count]} onLoad={handleTweetLoaded} />}
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
        <Box display="flex" alignItems="center">
            <FormControl>
                <InputLabel id="year-select-label">Year</InputLabel>
                <Select labelId="year-select-label" title="Year" onChange={onChange} value={currentSource.key}>
                    {
                        sources.map(({ key, name }) => <MenuItem key={key} value={key} selected={key === source}>{name}</MenuItem>)
                    }
                </Select>
            </FormControl>
            <IconButton
                href="https://github.com/lempiji/dman-tweet-viewer"
                target="_blank"
              >
                <GitHubIcon />
              </IconButton>
        </Box>
        <Viewer url={currentSource.url} />
    </div>;
}

ReactDOM.render(<App />, document.getElementById("app"));
