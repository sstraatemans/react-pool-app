import React from 'react';
import PropTypes from 'prop-types';
import isMobile from './../../utils/isMobile';
import Device from './../../utils/device';
import {
  SwipeWrapper,
  DeleteLayer,
  DeleteLayerLeft,
  DeleteLayerRight,
  SwipeContentWrapper,
  SwipeContent,
} from './styles';

class SwipeDelete extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isDeleted: false,
      deleteDirection: null,
      deleteCancel: false,
    };

    this.deleteSwipe = 0.5;
    this.startX = 0;
    this.device = Device.factory(isMobile.any());
  }

  render() {
    if (this.state.isDeleted) {
      return null;
    }

    return (
      <SwipeWrapper>
        <DeleteLayer key="delete">
          <DeleteLayerLeft>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path d="M3 6v18h18v-18h-18zm5 14c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm4-18v2h-20v-2h5.711c.9 0 1.631-1.099 1.631-2h5.315c0 .901.73 2 1.631 2h5.712z" />
            </svg>
          </DeleteLayerLeft>
          <DeleteLayerRight>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path d="M3 6v18h18v-18h-18zm5 14c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm4-18v2h-20v-2h5.711c.9 0 1.631-1.099 1.631-2h5.315c0 .901.73 2 1.631 2h5.712z" />
            </svg>
          </DeleteLayerRight>
        </DeleteLayer>
        <SwipeContentWrapper
          key="content"
          innerRef={el => (this.regionContent = el)}
        >
          <SwipeContent
            deleteDirection={this.state.deleteDirection}
            deleteCancel={this.state.deleteCancel}
          >
            {this.props.children}
          </SwipeContent>
        </SwipeContentWrapper>
      </SwipeWrapper>
    );
  }

  componentDidMount() {
    this.addHandlers();
  }

  addHandlers = () => {
    this.step = this.startInteract()
      .then(this.interact)
      .then(this.stopInteract)
      .then(this.endInteract)
      .catch(this.addHandlers);
  };

  startInteract = () => {
    return new Promise(resolve => {
      this.onInteract = e => {
        el.removeEventListener(
          this.device.getStartEventName(),
          this.onInteract,
          false
        );
        this.startX = this.device.getPageX(e);
        resolve();
      };
      const el = this.regionContent.firstChild;
      el.addEventListener(
        this.device.getStartEventName(),
        this.onInteract,
        false
      );
    });
  };

  interact = () => {
    document.addEventListener(
      this.device.getInteractEventName(),
      this.moveAt,
      false
    );
  };

  offInteract = () => {
    document.removeEventListener(
      this.device.getInteractEventName(),
      this.moveAt,
      false
    );
  };

  moveAt = e => {
    const target = this.regionContent.firstChild;
    const res = this.device.getPageX(e) - this.startX;

    target.style.left = `${res}px`;
  };

  stopInteract = () => {
    return new Promise((resolve, reject) => {
      const el = this.regionContent.firstChild;

      this._onStopInteract = e => this.onStopInteract(e, resolve, reject);

      this.device
        .getStopEventNames()
        .forEach(eventName =>
          el.addEventListener(eventName, this._onStopInteract, false)
        );
    });
  };

  onStopInteract = (e, resolve, reject) => {
    const el = this.regionContent.firstChild;

    this.offInteract();
    this.device
      .getStopEventNames()
      .forEach(eventName =>
        el.removeEventListener(eventName, this._onStopInteract, false)
      );

    const shift = e.currentTarget.offsetLeft;
    !shift ? reject() : resolve();
  };

  endInteract = () => {
    const target = this.regionContent.firstChild;
    const swipePercent = this.getSwipePercent();

    const promise = new Promise((resolve, reject) => {
      if (this.isDelete(swipePercent)) {
        target.addEventListener('transitionend', e => resolve(e), false);
        swipePercent < 0
          ? this.setState({ deleteDirection: 'left' })
          : this.setState({ deleteDirection: 'right' });
      } else {
        target.addEventListener('transitionend', e => reject(e), false);
        this.setState({ deleteCancel: true });
      }
    });

    promise.then(this.onDelete, this.onCancel);

    return promise;
  };

  getSwipePercent = () => {
    const shift = this.regionContent.firstChild.offsetLeft;
    const width = this.regionContent.clientWidth;

    return this.calcSwipePercent({ shift, width });
  };

  isDelete(percent) {
    return (
      (percent > 0 && percent >= this.deleteSwipe) ||
      (percent < 0 && percent <= -this.deleteSwipe)
    );
  }

  calcSwipePercent = ({ shift, width }) => {
    return shift / width;
  };

  onDelete = () => {
    this.setState({ isDeleted: true });
    this.props.onDelete(this.props.deleteId, this.props.deleteObject);
  };

  onCancel = e => {
    const target = e.currentTarget;
    this.setState({ deleteCancel: false });
    this.setState({ deleteDirection: null });

    this.startX = target.style.left = 0;
  };
}

SwipeDelete.defaultProps = {
  tag: 'div',
  onDelete: () => {},
};

SwipeDelete.propTypes = {
  children: PropTypes.element.isRequired,
  onDelete: PropTypes.func,
  deleteId: PropTypes.string,
  deleteObject: PropTypes.object,
  tag: PropTypes.string,
};

export default SwipeDelete;
