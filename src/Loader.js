import React from "react";
import { Spin, Icon, Typography } from "antd";

export default function Loader(props) {
  const { message, visible } = props;
  return visible ? (
    <div className="loader-wrapper">
      <div className="content">
        <Spin
          size="large"
          indicator={
            <Icon
              type="loading"
              style={{ fontSize: 42, marginRight: 30 }}
              spin
            />
          }
        />
        <Typography.Text style={{ fontSize: 18 }}>
          {message || "Running visualization ..."}
        </Typography.Text>
      </div>
    </div>
  ) : null;
}
