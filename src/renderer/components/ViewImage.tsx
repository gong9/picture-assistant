import { FC } from 'react';
import { Image } from 'antd';
import './ViewImage.scss';

interface ViewImageProps {
  imageArray: string[];
}

// eslint-disable-next-line react/function-component-definition
const ViewImage: FC<ViewImageProps> = ({ imageArray }) => {
  return (
    <div className="image-views">
      <Image.PreviewGroup
        preview={{
          onChange: (current, prev) =>
            console.log(`current index: ${current}, prev index: ${prev}`),
        }}
      >
        {imageArray.map((item) => {
          return <Image src={item} />;
        })}
      </Image.PreviewGroup>
    </div>
  );
};

export default ViewImage;
