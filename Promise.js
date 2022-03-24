function Promise(executor) {
  //添加必要属性
  this.PromiseState = 'pending';
  this.PromiseResult = null;
  this.callback = [];
  //保存实例对象的this值，否则在调用resolve和reject的时候，this为windows
  const self = this;
  function resolve(data) {
    //保证promise的状态只能改变一次
    if (self.PromiseState !== 'pending') return;
    //1.修改对象的状态
    self.PromiseState = 'fulfilled';
    //2.修改对象结果值
    self.PromiseResult = data;
    //setTimeout,将调用成功函数的任务放进异步队列,从而实现让then外面的同步代码先执行
    //其实这里setTimeout是宏任务，queueMicrotask才是微任务，才是promise的最终形式
    setTimeout(() => {
      self.callbacks.forEach((item) => {
        item.onResolved(data);
      });
    });
  }
  function reject(data) {
    if (self.PromiseState !== 'pending') return;
    self.PromiseState = 'rejected';
    self.PromiseResult = data;
    setTimeout(() => {
      self.callback.forEach((item) => {
        item.onRejected(data);
      });
    });
  }
  //try catch 可以保证执行器在抛出异常的时候可以执行reject函数，而不是把异常抛到最外面
  try {
    executor(resolve, reject);
  } catch (e) {
    reject(e);
  }
}

Promise.prototype.then = function (onResolved, onRejected) {
  //这里需要保存实例的指针，把promiseresult传给onResolved，保证在后续window调用resolve的时候可以拿到正确的promiseresult
  const self = this;
  return new Promise((resolve, reject) => {
    function callback(type) {
      try {
        //获取一下传入回调函数的结果
        const result = type(self.PromiseState);
        //回调函数返回一个Promise，那么这个Promise的结果就是then的结果
        if (typeof result === Promise) {
          result.then(
            (v) => {
              resolve(v);
            },
            (r) => {
              reject(r);
            }
          );
        } else {
          //如果不是一个Promise那么直接返回这个值即可
          resolve(result);
        }
        type(this.PromiseResult);
      } catch (e) {
        reject(e);
      }
    }

    //在这里可以用this，因为then方法都是通过实例调用的
    if (this.PromiseState === 'fulfilled') {
      setTimeout(() => {
        callback(onResolved);
      });
    }
    if (this.PromiseState === 'rejected') {
      setTimeout(() => {
        callback(onRejected);
      });
    }
    if (this.PromiseState === 'pending') {
      this.callback.push({
        onResolved: function () {
          callback(onResolved);
        },
        onRejected: function () {
          callback(onRejected);
        },
      });
    }
  });
};
