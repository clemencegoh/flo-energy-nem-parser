export interface BaseProps {
    classnames?: string;
    'data-testid'?: string;
}

export interface ExpectedS3File {
    filename: string;
    key: string;
    url: string;
  }